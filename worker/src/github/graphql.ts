import { graphql } from '@octokit/graphql';
import type {
  GitHubContributionCalendar,
  GitHubContributionResponse,
} from './types.js';

const CONTRIBUTION_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
      }
    }
  }
`;

function log(stage: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...data, ts: Date.now() }));
}

/**
 * Fetch the 12-month contribution calendar from GitHub GraphQL API.
 *
 * Creates the graphql client inside the function (not module scope)
 * to comply with Cloudflare Workers runtime constraints.
 */
export async function fetchContributionCalendar(
  token: string,
  username: string = 'j-labbe',
): Promise<GitHubContributionCalendar> {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `bearer ${token}`,
    },
  });

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const from = oneYearAgo.toISOString();
  const to = now.toISOString();

  const response = await graphqlWithAuth<GitHubContributionResponse>(
    CONTRIBUTION_QUERY,
    { username, from, to },
  );

  const calendar =
    response.user.contributionsCollection.contributionCalendar;

  const daysCount = calendar.weeks.reduce(
    (sum, week) => sum + week.contributionDays.length,
    0,
  );

  log('fetch-contributions', {
    totalContributions: calendar.totalContributions,
    daysCount,
  });

  return calendar;
}
