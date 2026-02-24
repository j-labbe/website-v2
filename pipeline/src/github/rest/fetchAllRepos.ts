import type { Octokit } from "@octokit/rest";
import { log } from "../../utils";
import type { GitHubRepo } from "../types";

/**
 * Fetch all repos the authenticated user contributes to.
 * Uses automatic pagination via octokit.paginate.
 *
 * Combines two strategies to ensure complete coverage:
 * 1. listForAuthenticatedUser with affiliation filter (owned + collaborator repos)
 * 2. listForOrg for each org the user belongs to (catches org repos where
 *    the user committed but may not have explicit individual access)
 *
 * Results are deduplicated by repo id.
 */
export default async function fetchAllRepos(octokit: Octokit, orgs: string[] = []): Promise<GitHubRepo[]> {
    // fetch org + collaborator + owner repos
    const userRepos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
        affiliation: "owner,collaborator,organization_member",
        per_page: 100,
    });

    log("fetch-user-repos", { count: userRepos.length });

    const orgRepos = [];
    for (const org of orgs) {
        const repos = await octokit.paginate(octokit.repos.listForOrg, {
            org,
            per_page: 100,
        });
        log("fetch-org-repos", { org, count: repos.length });
        orgRepos.push(...repos);
    }

    // dedupe
    const seen = new Set<number>();
    const allRepos = [];

    for (const repo of [...userRepos, ...orgRepos]) {
        if (!seen.has(repo.id)) {
            seen.add(repo.id);
            allRepos.push(repo);
        }
    }

    log("fetch-repos", {
        userRepos: userRepos.length,
        orgRepos: orgRepos.length,
        deduplicated: allRepos.length,
    });

    return allRepos as GitHubRepo[];
}
