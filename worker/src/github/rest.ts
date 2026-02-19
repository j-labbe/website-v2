import { Octokit } from '@octokit/rest';
import type {
  GitHubRepo,
  GitHubCommit,
  GitHubCommitDetail,
} from './types.js';

function log(stage: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
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
 * Includes owned, org, and collaborator repos (covers forks too).
 */
export async function fetchAllRepos(
  octokit: Octokit,
): Promise<GitHubRepo[]> {
  const repos = await octokit.paginate(
    octokit.repos.listForAuthenticatedUser,
    {
      affiliation: 'owner,collaborator,organization_member',
      per_page: 100,
    },
  );

  log('fetch-repos', { count: repos.length });

  return repos as unknown as GitHubRepo[];
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

  log('fetch-commits', { repo: `${owner}/${repo}`, count: commits.length });

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
): Promise<GitHubCommitDetail | null> {
  // Check rate limit before the expensive individual commit fetch
  const { remaining } = await checkRateLimit(octokit);

  if (remaining < 200) {
    log('rate-limit-skip', {
      message: 'Skipping commit detail fetch -- rate limit too low',
      remaining,
      skippedCommit: `${owner}/${repo}@${ref.slice(0, 7)}`,
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
