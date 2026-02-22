import { Octokit } from "@octokit/rest";
import type { GitHubCommit } from "../types";
import { log, safeRepoId } from "../../utils";

/**
 * Fetch commits for a repo filtered by author and date range.
 * Uses automatic pagination. Returns commit SHAs, messages, and dates
 * but NOT stats (additions/deletions).
 */
export default async function fetchRepoCommits(
    octokit: Octokit,
    owner: string,
    repo: string,
    author: string,
    since: string,
    until?: string,
    isPrivate = false,
): Promise<GitHubCommit[]> {
    const params: Record<string, unknown> = {
        owner,
        repo,
        author,
        since,
        per_page: 100,
    };
    if (until) {
        params.until = until;
    }

    const commits = await octokit.paginate(
        octokit.repos.listCommits,
        params as Parameters<typeof octokit.repos.listCommits>[0],
    );

    log("fetch-commits", {
        repo: safeRepoId(owner, repo, isPrivate),
        count: commits.length,
    });

    return commits as GitHubCommit[];
}