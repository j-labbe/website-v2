import { describe, it, expect } from "vitest";
import { transformRepo, filterRepos } from "../projects";
import type { ProjectEntry } from "@jacklabbe/shared";

const mockPublicRepo = {
    id: 789012,
    full_name: "j-labbe/my-public-project",
    name: "my-public-project",
    html_url: "https://github.com/j-labbe/my-public-project",
    description: "An awesome open-source project",
    private: false,
    fork: false,
    parent: null,
    created_at: "2024-03-10T08:00:00Z",
    pushed_at: "2026-02-18T16:30:00Z",
    topics: ["typescript", "open-source"],
};

const mockPrivateRepo = {
    id: 123456,
    full_name: "j-labbe/secret-project",
    name: "secret-project",
    html_url: "https://github.com/j-labbe/secret-project",
    description: "Confidential stuff",
    private: true,
    fork: false,
    parent: null,
    created_at: "2025-01-01T00:00:00Z",
    pushed_at: "2026-02-15T12:00:00Z",
    topics: ["secret"],
};

const mockMonthlyCommits: Record<string, number> = {
    "2025-12": 10,
    "2026-01": 15,
    "2026-02": 5,
};

const mockLanguages: Record<string, number> = {
    TypeScript: 80000,
    JavaScript: 10000,
};

const mockRecentCommits = [
    {
        sha: "abc123",
        message: "feat: add new feature",
        date: "2026-02-18",
        additions: 50,
        deletions: 10,
    },
    {
        sha: "def456",
        message: "fix: resolve bug",
        date: "2026-02-17",
        additions: 5,
        deletions: 3,
    },
];

describe("transformRepo", () => {
    describe("public repos", () => {
        it("should include url, description, topics, and recentCommits for public repos", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
                mockRecentCommits,
            );
            expect(result.url).toBe(
                "https://github.com/j-labbe/my-public-project",
            );
            expect(result.description).toBe("An awesome open-source project");
            expect(result.topics).toEqual(["typescript", "open-source"]);
            expect(result.recentCommits).toEqual(mockRecentCommits);
        });

        it("should use GitHub numeric ID as string for public repo id", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.id).toBe("789012");
        });

        it("should set isPrivate to false for public repos", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.isPrivate).toBe(false);
        });

        it("should include name from repo for public repos", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.name).toBe("my-public-project");
        });

        it("should include languages as string array", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.languages).toEqual(["TypeScript", "JavaScript"]);
        });

        it("should compute totalCommits from monthlyCommits", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.totalCommits).toBe(30); // 10 + 15 + 5
        });

        it("should slice dates to YYYY-MM-DD", () => {
            const result = transformRepo(
                mockPublicRepo,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.createdAt).toBe("2024-03-10");
            expect(result.lastActiveAt).toBe("2026-02-18");
        });

        it("should handle public fork with parent info", () => {
            const publicFork = {
                ...mockPublicRepo,
                fork: true,
                parent: {
                    full_name: "original-org/original-repo",
                    html_url: "https://github.com/original-org/original-repo",
                    private: false,
                },
            };

            const result = transformRepo(
                publicFork,
                mockMonthlyCommits,
                mockLanguages,
            );
            expect(result.isFork).toBe(true);
            expect(result.parentRepo).toEqual({
                name: "original-org/original-repo",
                url: "https://github.com/original-org/original-repo",
            });
        });
    });

    describe("private repos", () => {
        it("should delegate to sanitizePrivateRepo for private repos", () => {
            const result = transformRepo(
                mockPrivateRepo,
                mockMonthlyCommits,
                mockLanguages,
                mockRecentCommits,
            );
            expect(result.name).toBe("Private Repo");
            expect(result.isPrivate).toBe(true);
            // Must NOT have public-only fields
            expect(result.url).toBeUndefined();
            expect(result.description).toBeUndefined();
            expect(result.topics).toBeUndefined();
            expect(result.recentCommits).toBeUndefined();
        });

        it("should NOT leak private repo info even when recentCommits are provided", () => {
            const result = transformRepo(
                mockPrivateRepo,
                mockMonthlyCommits,
                mockLanguages,
                mockRecentCommits,
            );
            const serialized = JSON.stringify(result);
            expect(serialized).not.toContain("secret-project");
            expect(serialized).not.toContain("Confidential");
            expect(serialized).not.toContain("feat: add new feature");
        });
    });
});

describe("filterRepos", () => {
    const makeEntry = (totalCommits: number, name: string): ProjectEntry => ({
        id: name,
        name,
        isPrivate: false,
        isFork: false,
        parentRepo: null,
        languages: ["TypeScript"],
        createdAt: "2025-01-01",
        lastActiveAt: "2026-01-01",
        monthlyCommits: { "2025-01": totalCommits },
        totalCommits,
    });

    it("should filter out repos with fewer than 3 commits", () => {
        const repos: ProjectEntry[] = [
            makeEntry(0, "empty-repo"),
            makeEntry(1, "one-commit"),
            makeEntry(2, "two-commits"),
        ];
        const result = filterRepos(repos);
        expect(result).toHaveLength(0);
    });

    it("should keep repos with 3 or more commits", () => {
        const repos: ProjectEntry[] = [
            makeEntry(3, "three-commits"),
            makeEntry(10, "active-repo"),
            makeEntry(100, "very-active"),
        ];
        const result = filterRepos(repos);
        expect(result).toHaveLength(3);
    });

    it("should correctly handle boundary (exactly 3 commits)", () => {
        const repos: ProjectEntry[] = [
            makeEntry(2, "just-under"),
            makeEntry(3, "exactly-three"),
            makeEntry(4, "just-over"),
        ];
        const result = filterRepos(repos);
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.name)).toEqual([
            "exactly-three",
            "just-over",
        ]);
    });

    it("should return empty array for empty input", () => {
        const result = filterRepos([]);
        expect(result).toHaveLength(0);
    });
});
