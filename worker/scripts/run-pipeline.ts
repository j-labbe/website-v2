import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CommitDetail,
  PipelineMeta,
  ProjectEntry,
} from '@jacklabbe/shared';
import { fetchContributionCalendar } from '../src/github/graphql.js';
import {
  createOctokit,
  fetchAllRepos,
  fetchRepoCommits,
  fetchRepoLanguages,
  fetchCommitDetail,
} from '../src/github/rest.js';
import { transformContributionCalendar } from '../src/transform/graph.js';
import { transformRepo, filterRepos } from '../src/transform/projects.js';

function log(stage: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
}

function toMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const outDir = join(process.cwd(), 'worker', 'output');
  mkdirSync(outDir, { recursive: true });

  try {
    log('pipeline-start', { mode: 'backfill' });

    // 1. Fetch contribution calendar (12 months)
    const calendar = await fetchContributionCalendar(token, 'j-labbe');
    const graphData = transformContributionCalendar(calendar);
    log('calendar-fetched', {
      totalContributions: graphData.totalContributions,
      days: graphData.days.length,
    });

    // 2. Fetch all repos
    const octokit = createOctokit(token);
    const allRepos = await fetchAllRepos(octokit);
    log('repos-fetched', { total: allRepos.length });

    // 3. Date range: 24 months back for full backfill
    const now = new Date();
    const since = new Date(
      now.getFullYear() - 2,
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    const until = now.toISOString();

    // 4. Process each repo
    const allEntries: ProjectEntry[] = [];
    let rateLimitDepleted = false;

    for (let i = 0; i < allRepos.length; i++) {
      const repo = allRepos[i];
      const [owner, repoName] = repo.full_name.split('/');

      const languages = await fetchRepoLanguages(octokit, owner, repoName);

      const commits = await fetchRepoCommits(
        octokit,
        owner,
        repoName,
        'j-labbe',
        since,
        until,
      );

      const monthlyCommits: Record<string, number> = {};
      for (const commit of commits) {
        const key = toMonthKey(commit.commit.author.date);
        monthlyCommits[key] = (monthlyCommits[key] ?? 0) + 1;
      }

      // Rich commit details for public repos only
      let recentCommits: CommitDetail[] | undefined;
      if (!repo.private && !rateLimitDepleted) {
        const details: CommitDetail[] = [];
        const recentShas = commits.slice(0, 10);

        for (const c of recentShas) {
          const detail = await fetchCommitDetail(
            octokit,
            owner,
            repoName,
            c.sha,
          );
          if (detail === null) {
            rateLimitDepleted = true;
            log('rate-limit-depleted', {
              processedRepos: i + 1,
              totalRepos: allRepos.length,
            });
            break;
          }
          details.push({
            sha: detail.sha,
            message: detail.commit.message,
            date: detail.commit.author.date.slice(0, 10),
            additions: detail.stats.additions,
            deletions: detail.stats.deletions,
          });
        }

        if (details.length > 0) {
          recentCommits = details;
        }
      }

      const entry = transformRepo(
        {
          id: repo.id,
          full_name: repo.full_name,
          name: repo.name,
          html_url: repo.html_url,
          description: repo.description,
          private: repo.private,
          fork: repo.fork,
          parent: repo.parent ?? null,
          created_at: repo.created_at,
          pushed_at: repo.pushed_at,
        },
        monthlyCommits,
        languages,
        recentCommits,
      );
      allEntries.push(entry);

      if ((i + 1) % 10 === 0 || i === allRepos.length - 1) {
        log('repos-processed', { current: i + 1, total: allRepos.length });
      }
    }

    // 5. Filter repos with <3 commits
    const projects = filterRepos(allEntries);
    log('repos-filtered', {
      before: allEntries.length,
      after: projects.length,
    });

    // 6. Write JSON files
    const publicCount = projects.filter((p) => !p.isPrivate).length;
    const privateCount = projects.filter((p) => p.isPrivate).length;

    const meta: PipelineMeta = {
      lastUpdated: now.toISOString(),
      status: 'ok',
      projectCount: projects.length,
      publicCount,
      privateCount,
    };

    writeFileSync(join(outDir, 'graph.json'), JSON.stringify(graphData));
    writeFileSync(
      join(outDir, 'projects.json'),
      JSON.stringify({ projects }),
    );
    writeFileSync(join(outDir, 'meta.json'), JSON.stringify(meta));

    log('pipeline-complete', {
      projectCount: projects.length,
      publicCount,
      privateCount,
      outputDir: outDir,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown pipeline error';
    log('pipeline-error', { error: message });

    // Write error meta so R2 reflects the failure
    const errorMeta: PipelineMeta = {
      lastUpdated: new Date().toISOString(),
      status: 'error',
      error: message,
      errorAt: new Date().toISOString(),
      projectCount: 0,
      publicCount: 0,
      privateCount: 0,
    };
    writeFileSync(join(outDir, 'meta.json'), JSON.stringify(errorMeta));
    process.exit(1);
  }
}

main();
