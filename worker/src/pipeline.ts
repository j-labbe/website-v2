import type { CommitDetail } from '@jacklabbe/shared';
import { fetchContributionCalendar } from './github/graphql.js';
import {
  createOctokit,
  fetchAllRepos,
  fetchRepoCommits,
  fetchRepoLanguages,
  fetchCommitDetail,
  checkRateLimit,
} from './github/rest.js';
import { transformContributionCalendar } from './transform/graph.js';
import { transformRepo, filterRepos } from './transform/projects.js';
import { isBackfillNeeded } from './transform/backfill.js';
import { readMeta, writePipelineResults, writeErrorMeta } from './r2.js';

interface Env {
  R2_BUCKET: R2Bucket;
  GITHUB_TOKEN: string;
  REFRESH_SECRET: string;
}

function log(stage: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
}

/**
 * Compute "YYYY-MM" key from an ISO date string.
 */
function toMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/**
 * Run the full data pipeline: fetch GitHub data, transform, write to R2.
 *
 * On success: writes graph.json, projects.json, meta.json to R2.
 * On failure: writes error meta (preserves existing data) and re-throws.
 */
export async function runPipeline(
  env: Env,
  forceBackfill?: boolean,
): Promise<void> {
  try {
    // 1. Read existing meta to determine backfill vs incremental
    const meta = await readMeta(env.R2_BUCKET);
    const backfill = forceBackfill || isBackfillNeeded(meta);
    log('pipeline-start', { mode: backfill ? 'backfill' : 'incremental' });

    // 2. Fetch contribution calendar (always 12 months)
    const calendar = await fetchContributionCalendar(
      env.GITHUB_TOKEN,
      'j-labbe',
    );
    const graphData = transformContributionCalendar(calendar);

    // 3. Fetch all repos
    const octokit = createOctokit(env.GITHUB_TOKEN);
    const allRepos = await fetchAllRepos(octokit);
    log('repos-fetched', { total: allRepos.length });

    // 4. Determine date range for commit fetches
    const now = new Date();
    const sinceDate = backfill
      ? new Date(
          now.getFullYear() - 2,
          now.getMonth(),
          now.getDate(),
        )
      : new Date(meta!.lastUpdated);
    const since = sinceDate.toISOString();
    const until = now.toISOString();

    // 5. For each repo: fetch languages, commits, commit details, transform
    const allEntries = [];
    let rateLimitDepleted = false;

    for (let i = 0; i < allRepos.length; i++) {
      const repo = allRepos[i];
      const [owner, repoName] = repo.full_name.split('/');

      // Fetch languages
      const languages = await fetchRepoLanguages(octokit, owner, repoName);

      // Fetch commits by author in date range
      const commits = await fetchRepoCommits(
        octokit,
        owner,
        repoName,
        'j-labbe',
        since,
        until,
      );

      // Aggregate commits into monthly buckets
      const monthlyCommits: Record<string, number> = {};
      for (const commit of commits) {
        const key = toMonthKey(commit.commit.author.date);
        monthlyCommits[key] = (monthlyCommits[key] ?? 0) + 1;
      }

      // For PUBLIC repos only: fetch up to 10 recent commit details
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
            // Rate limit approaching -- stop fetching details for all repos
            rateLimitDepleted = true;
            log('rate-limit-depleted', {
              message:
                'Stopping commit detail fetches for remaining repos',
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

      // Transform into ProjectEntry
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

      // Log progress every 10 repos
      if ((i + 1) % 10 === 0 || i === allRepos.length - 1) {
        const rateInfo = await checkRateLimit(octokit);
        log('repos-processed', {
          current: i + 1,
          total: allRepos.length,
          rateLimitRemaining: rateInfo.remaining,
        });
      }
    }

    // 6. Filter repos with <3 commits
    const projects = filterRepos(allEntries);
    log('repos-filtered', {
      before: allEntries.length,
      after: projects.length,
    });

    // 7. Write to R2
    await writePipelineResults(env.R2_BUCKET, graphData, projects);
    log('pipeline-complete', { projectCount: projects.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown pipeline error';
    log('pipeline-error', { error: message });
    await writeErrorMeta(env.R2_BUCKET, message);
    throw err;
  }
}
