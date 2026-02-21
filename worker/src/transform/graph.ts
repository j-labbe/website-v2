import type { GraphData, ContributionDay } from "@jacklabbe/shared";
import type {
    ContributionLevel,
    GitHubContributionCalendar,
} from "../github/types.js";

const LEVEL_MAP: Record<ContributionLevel, 0 | 1 | 2 | 3 | 4> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
};

/**
 * Transform GitHub's contributionCalendar into GraphData.
 *
 * Flattens the nested weeks/days structure into a flat ContributionDay array
 * and maps the contributionLevel enum to 0-4 integer levels.
 */
export function transformContributionCalendar(
    calendar: GitHubContributionCalendar,
): GraphData {
    const days: ContributionDay[] = calendar.weeks.flatMap((week) =>
        week.contributionDays.map((day) => ({
            date: day.date,
            count: day.contributionCount,
            level: LEVEL_MAP[day.contributionLevel],
        })),
    );

    return {
        days,
        totalContributions: calendar.totalContributions,
        rangeStart: days.length > 0 ? days[0].date : "",
        rangeEnd: days.length > 0 ? days[days.length - 1].date : "",
    };
}
