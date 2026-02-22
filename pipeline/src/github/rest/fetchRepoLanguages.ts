import { Octokit } from "@octokit/rest";

/**
 * Fetch language breakdown for a repository.
 * Returns a map of language name to byte count.
 */
export default async function fetchRepoLanguages(
    octokit: Octokit,
    owner: string,
    repo: string,
): Promise<Record<string, number>> {
    const { data } = await octokit.repos.listLanguages({ owner, repo });
    return data;
}