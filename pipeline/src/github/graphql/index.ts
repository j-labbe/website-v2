import { graphql } from "@octokit/graphql";
import type {
    GitHubContributionCalendar,
    GitHubContributionResponse,
} from "../types";
import { CONTRIBUTION_QUERY } from "./queries";
import { log } from "../../utils";


/**
 * Fetch the 12-month contribution calendar from GitHub GraphQL API.
 */
export async function fetchContributionCalendar( token: string, username: string = "j-labbe" ): Promise<GitHubContributionCalendar> {
    const graphqlClient = graphql.defaults({
        headers: {
            authorization: `bearer ${token}`,
        },
    });

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const from = oneYearAgo.toISOString();
    const to = now.toISOString();

    const response = await graphqlClient<GitHubContributionResponse>(
        CONTRIBUTION_QUERY,
        { username, from, to },
    );

    const calendar = response.user.contributionsCollection.contributionCalendar;

    const daysCount = calendar.weeks.reduce(
        (sum, week) => sum + week.contributionDays.length,
        0,
    );

    log("fetch-contributions", {
        totalContributions: calendar.totalContributions,
        daysCount,
    });

    return calendar;
}
