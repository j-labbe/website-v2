import { Octokit } from "@octokit/rest";
import type { GitHubCommitDetail } from "../types";
import { log, safeRepoId } from "../../utils";
import checkRateLimit from "./checkRateLimit";

/**
 * Fetch full details for a single commit including diff stats.
 * This is the N+1 call from the research -- only called for
 * public repos' recent commits to collect additions/deletions.
 *
 * Checks rate limit before each call. If remaining < 200,
 * logs a warning and returns null (graceful degradation).
 */
export default async function fetchCommitDetail(
    octokit: Octokit,
    owner: string,
    repo: string,
    ref: string,
    isPrivate = false,
): Promise<GitHubCommitDetail | null> {
    // Check rate limit before the expensive individual commit fetch
    const { remaining } = await checkRateLimit(octokit);

    if (remaining < 200) {
        log("rate-limit-skip", {
            message: "Skipping commit detail fetch -- rate limit too low",
            remaining,
            skippedCommit: `${safeRepoId(owner, repo, isPrivate)}@${ref.slice(0, 7)}`,
        });
        return null;
    }

    const { data } = await octokit.repos.getCommit({ owner, repo, ref });

    return {
        sha: data.sha,
        commit: {
            message: data.commit.message,
            author: {
                date: data.commit.author?.date ?? "",
            },
        },
        stats: {
            additions: data.stats?.additions ?? 0,
            deletions: data.stats?.deletions ?? 0,
        },
    };
}