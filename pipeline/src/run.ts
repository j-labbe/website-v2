import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { CommitDetail, PipelineMeta, ProjectEntry } from "@jacklabbe/shared";
import { Octokit } from "@octokit/rest";
import { fetchContributionCalendar } from "./github/graphql";
import { fetchAllRepos, fetchRepoCommits, fetchRepoLanguages, fetchCommitDetail } from "./github/rest";
import { transformContributionCalendar } from "./transform/graph";
import { transformRepo, filterRepos } from "./transform/projects";
import { log, toMonthKey, loadConfig } from "./utils";

async function main() {
    const token = process.env.GH_PAT;
    if (!token) {
        console.error("GH_PAT environment variable is required");
        process.exit(1);
    }

    const outDir = join(process.cwd(), "output");

    try {
        const config = loadConfig();
        log("config-loaded", { username: config.username, orgs: config.orgs });

        mkdirSync(outDir, { recursive: true });

        log("pipeline-start", { mode: "backfill" });

        const calendar = await fetchContributionCalendar(token, config.username);

        const graphData = transformContributionCalendar(calendar);

        log("calendar-fetched", {
            totalContributions: graphData.totalContributions,
            days: graphData.days.length,
        });

        const octokit = new Octokit({ auth: token });
        const allRepos = await fetchAllRepos(octokit, config.orgs);

        log("repos-fetched", { total: allRepos.length });

        // Date range: 24 months back for full backfill
        const now = new Date();
        const since = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString();
        const until = now.toISOString();

        // process repos
        const allEntries: ProjectEntry[] = [];
        let rateLimitDepleted = false;

        for (let i = 0; i < allRepos.length; i++) {
            const repo = allRepos[i];
            const [owner, repoName] = repo.full_name.split("/");

            const languages = await fetchRepoLanguages(octokit, owner, repoName);

            const commits = await fetchRepoCommits(
                octokit,
                owner,
                repoName,
                config.username,
                since,
                until,
                repo.private,
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
                    const detail = await fetchCommitDetail(octokit, owner, repoName, c.sha);
                    if (detail === null) {
                        rateLimitDepleted = true;
                        log("rate-limit-depleted", {
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

            // log progress every 10 repos or at the end
            if ((i + 1) % 10 === 0 || i === allRepos.length - 1) {
                log("repos-processed", {
                    current: i + 1,
                    total: allRepos.length,
                });
            }
        }

        // remove repos with < 3 commits
        const projects = filterRepos(allEntries);
        log("repos-filtered", {
            before: allEntries.length,
            after: projects.length,
        });

        const publicCount = projects.filter((p) => !p.isPrivate).length;
        const privateCount = projects.filter((p) => p.isPrivate).length;

        const meta: PipelineMeta = {
            lastUpdated: now.toISOString(),
            status: "ok",
            projectCount: projects.length,
            publicCount,
            privateCount,
        };

        writeFileSync(join(outDir, "graph.json"), JSON.stringify(graphData));
        writeFileSync(join(outDir, "projects.json"), JSON.stringify({ projects }));
        writeFileSync(join(outDir, "meta.json"), JSON.stringify(meta));

        log("pipeline-complete", {
            projectCount: projects.length,
            publicCount,
            privateCount,
            outputDir: outDir,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown pipeline error";
        log("pipeline-error", { error: message });

        const errorMeta: PipelineMeta = {
            lastUpdated: new Date().toISOString(),
            status: "error",
            error: message,
            errorAt: new Date().toISOString(),
            projectCount: 0,
            publicCount: 0,
            privateCount: 0,
        };
        writeFileSync(join(outDir, "meta.json"), JSON.stringify(errorMeta));
        process.exit(1);
    }
}

main();
