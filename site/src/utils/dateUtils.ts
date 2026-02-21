import type { ProjectEntry } from "@jacklabbe/shared";

export interface MonthGroup {
    key: string;
    label: string;
    projects: ProjectEntry[];
}

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

/** Converts "2026-02" to "February 2026" */
export function formatMonthLabel(key: string): string {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return monthLabelFormatter.format(date);
}

/** Returns "Jan 2025 -- Feb 2026" format */
export function formatDateRange(
    createdAt: string,
    lastActiveAt: string,
): string {
    const start = new Date(createdAt + "T00:00:00Z");
    const end = new Date(lastActiveAt + "T00:00:00Z");
    return `${shortDateFormatter.format(start)} \u2013 ${shortDateFormatter.format(end)}`;
}

/**
 * Groups projects by month. Each project appears in every month it was active.
 * Months sorted newest first; within each month, projects sorted by lastActiveAt descending.
 */
export function groupByMonth(projects: ProjectEntry[]): MonthGroup[] {
    const monthMap = new Map<string, ProjectEntry[]>();

    for (const project of projects) {
        const activeMonths = Object.keys(project.monthlyCommits);
        for (const monthKey of activeMonths) {
            let group = monthMap.get(monthKey);
            if (!group) {
                group = [];
                monthMap.set(monthKey, group);
            }
            group.push(project);
        }
    }

    // Sort months newest first
    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) =>
        b.localeCompare(a),
    );

    return sortedKeys.map((key) => {
        const monthProjects = monthMap.get(key)!;
        // Within each month, sort by lastActiveAt descending
        monthProjects.sort((a, b) =>
            b.lastActiveAt.localeCompare(a.lastActiveAt),
        );

        return {
            key,
            label: formatMonthLabel(key),
            projects: monthProjects,
        };
    });
}
