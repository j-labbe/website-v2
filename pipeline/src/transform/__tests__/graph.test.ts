import { describe, it, expect } from "vitest";
import { transformContributionCalendar } from "../graph";

const mockCalendar = {
    totalContributions: 42,
    weeks: [
        {
            contributionDays: [
                {
                    contributionCount: 0,
                    contributionLevel: "NONE" as const,
                    date: "2025-02-17",
                },
                {
                    contributionCount: 3,
                    contributionLevel: "FIRST_QUARTILE" as const,
                    date: "2025-02-18",
                },
                {
                    contributionCount: 7,
                    contributionLevel: "SECOND_QUARTILE" as const,
                    date: "2025-02-19",
                },
            ],
        },
        {
            contributionDays: [
                {
                    contributionCount: 12,
                    contributionLevel: "THIRD_QUARTILE" as const,
                    date: "2025-02-24",
                },
                {
                    contributionCount: 20,
                    contributionLevel: "FOURTH_QUARTILE" as const,
                    date: "2025-02-25",
                },
            ],
        },
    ],
};

describe("transformContributionCalendar", () => {
    it("should map contributionLevel enum to integer levels", () => {
        const result = transformContributionCalendar(mockCalendar);
        expect(result.days[0].level).toBe(0); // NONE -> 0
        expect(result.days[1].level).toBe(1); // FIRST_QUARTILE -> 1
        expect(result.days[2].level).toBe(2); // SECOND_QUARTILE -> 2
        expect(result.days[3].level).toBe(3); // THIRD_QUARTILE -> 3
        expect(result.days[4].level).toBe(4); // FOURTH_QUARTILE -> 4
    });

    it("should flatten nested weeks/days into a flat array", () => {
        const result = transformContributionCalendar(mockCalendar);
        expect(result.days).toHaveLength(5); // 3 + 2 from two weeks
    });

    it('should preserve contribution counts as "count"', () => {
        const result = transformContributionCalendar(mockCalendar);
        expect(result.days[0].count).toBe(0);
        expect(result.days[1].count).toBe(3);
        expect(result.days[2].count).toBe(7);
        expect(result.days[3].count).toBe(12);
        expect(result.days[4].count).toBe(20);
    });

    it("should preserve dates", () => {
        const result = transformContributionCalendar(mockCalendar);
        expect(result.days[0].date).toBe("2025-02-17");
        expect(result.days[4].date).toBe("2025-02-25");
    });

    it("should pass through totalContributions", () => {
        const result = transformContributionCalendar(mockCalendar);
        expect(result.totalContributions).toBe(42);
    });

    it("should set rangeStart to first day date and rangeEnd to last day date", () => {
        const result = transformContributionCalendar(mockCalendar);
        expect(result.rangeStart).toBe("2025-02-17");
        expect(result.rangeEnd).toBe("2025-02-25");
    });

    it("should handle empty calendar (no weeks)", () => {
        const emptyCalendar = {
            totalContributions: 0,
            weeks: [],
        };
        const result = transformContributionCalendar(emptyCalendar);
        expect(result.days).toHaveLength(0);
        expect(result.totalContributions).toBe(0);
        expect(result.rangeStart).toBe("");
        expect(result.rangeEnd).toBe("");
    });

    it("should handle single day calendar", () => {
        const singleDay = {
            totalContributions: 5,
            weeks: [
                {
                    contributionDays: [
                        {
                            contributionCount: 5,
                            contributionLevel: "SECOND_QUARTILE" as const,
                            date: "2026-01-01",
                        },
                    ],
                },
            ],
        };
        const result = transformContributionCalendar(singleDay);
        expect(result.days).toHaveLength(1);
        expect(result.rangeStart).toBe("2026-01-01");
        expect(result.rangeEnd).toBe("2026-01-01");
    });
});
