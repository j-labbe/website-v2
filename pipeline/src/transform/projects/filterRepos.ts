import type { ProjectEntry } from "@jacklabbe/shared";

/**
 * Filter out repos with fewer than 3 total commits.
 * Removes drive-by forks, empty inits, and other low-signal repos.
 */
export default function filterRepos(repos: ProjectEntry[]): ProjectEntry[] {
    return repos.filter((repo) => repo.totalCommits >= 3);
}
