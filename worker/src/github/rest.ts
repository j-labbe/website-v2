import { Octokit } from '@octokit/rest';
import type {
  GitHubRepo,
  GitHubCommit,
  GitHubCommitDetail,
} from './types.js';

function log(stage: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
}

/**
 * Return a safe display name for a repo in logs.
 * Private repos are redacted to avoid leaking names into CI logs.
 */
function safeRepoId(
  owner: string,
  repo: string,
  isPrivate: boolean,
): string {
  return isPrivate ? '[private]' : `${owner}/${repo}`;
}

// -- Rate limit helpers --

interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
}

/**
 * Check the current rate limit status for the REST API.
 * Logs remaining/limit for both core (REST) and graphql resources.
 * Returns the core resource rate limit info.
 */
export async function checkRateLimit(
  octokit: Octokit,
): Promise<RateLimitInfo> {
  const { data } = await octokit.rateLimit.get();

  const core = data.resources.core;
  const graphql = data.resources.graphql;

  log('rate-limit', {
    core: { remaining: core.remaining, limit: core.limit },
    graphql: graphql
      ? { remaining: graphql.remaining, limit: graphql.limit }
      : { remaining: 'unknown', limit: 'unknown' },
  });

  if (core.remaining < 100) {
    log('rate-limit-warning', {
      message: 'REST rate limit critically low',
      remaining: core.remaining,
      resetsAt: new Date(core.reset * 1000).toISOString(),
    });
  }

  return {
    remaining: core.remaining,
    resetAt: new Date(core.reset * 1000),
  };
}

// -- Octokit factory --

/**
 * Create an Octokit instance with the given token.
 * MUST be called inside handler context, not at module scope
 * (Workers runtime constraint).
 */
export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

// -- Repo enumeration --

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
export async function fetchAllRepos(
  octokit: Octokit,
): Promise<GitHubRepo[]> {
  // 1. Fetch repos where user has explicit access (owned + collaborator + org member)
  const userRepos = await octokit.paginate(
    octokit.repos.listForAuthenticatedUser,
    {
      affiliation: 'owner,collaborator,organization_member',
      per_page: 100,
    },
  );

  log('fetch-user-repos', { count: userRepos.length });

  // 2. Fetch all orgs the user belongs to
  const orgs = await octokit.paginate(octokit.orgs.listForAuthenticatedUser, {
    per_page: 100,
  });

  log('fetch-orgs', { count: orgs.length, orgs: orgs.map((o) => o.login) });

  // 3. For each org, fetch all repos (includes repos where user has
  //    org-level access but not explicit individual permission)
  const orgRepos = [];
  for (const org of orgs) {
    const repos = await octokit.paginate(octokit.repos.listForOrg, {
      org: org.login,
      per_page: 100,
    });
    log('fetch-org-repos', { org: org.login, count: repos.length });
    orgRepos.push(...repos);
  }

  // 4. Merge and deduplicate by repo id
  const seen = new Set<number>();
  const allRepos = [];

  for (const repo of [...userRepos, ...orgRepos]) {
    if (!seen.has(repo.id)) {
      seen.add(repo.id);
      allRepos.push(repo);
    }
  }

  log('fetch-repos', {
    userRepos: userRepos.length,
    orgRepos: orgRepos.length,
    deduplicated: allRepos.length,
  });

  return allRepos as unknown as GitHubRepo[];
}

// -- Language fetching --

/**
 * Fetch language breakdown for a repository.
 * Returns a map of language name to byte count.
 */
export async function fetchRepoLanguages(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<Record<string, number>> {
  const { data } = await octokit.repos.listLanguages({ owner, repo });
  return data;
}

// -- Commit listing --

/**
 * Fetch commits for a repo filtered by author and date range.
 * Uses automatic pagination. Returns commit SHAs, messages, and dates
 * but NOT stats (additions/deletions).
 */
export async function fetchRepoCommits(
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

  log('fetch-commits', {
    repo: safeRepoId(owner, repo, isPrivate),
    count: commits.length,
  });

  return commits as unknown as GitHubCommit[];
}

// -- Individual commit detail --

/**
 * Fetch full details for a single commit including diff stats.
 * This is the N+1 call from the research -- only called for
 * public repos' recent commits to collect additions/deletions.
 *
 * Checks rate limit before each call. If remaining < 200,
 * logs a warning and returns null (graceful degradation).
 */
export async function fetchCommitDetail(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  isPrivate = false,
): Promise<GitHubCommitDetail | null> {
  // Check rate limit before the expensive individual commit fetch
  const { remaining } = await checkRateLimit(octokit);

  if (remaining < 200) {
    log('rate-limit-skip', {
      message: 'Skipping commit detail fetch -- rate limit too low',
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
        date: data.commit.author?.date ?? '',
      },
    },
    stats: {
      additions: data.stats?.additions ?? 0,
      deletions: data.stats?.deletions ?? 0,
    },
  };
}
