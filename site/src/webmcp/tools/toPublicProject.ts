import type { ProjectEntry } from "@jacklabbe/shared";

export default function toPublicProject(project: ProjectEntry) {
    if (project.isPrivate) {
        return {
            id: project.id,
            name: "Private Repo",
            isPrivate: true,
            languages: project.languages,
            createdAt: project.createdAt,
            lastActiveAt: project.lastActiveAt,
            totalCommits: project.totalCommits,
        };
    }

    return {
        id: project.id,
        name: project.name,
        isPrivate: false,
        url: project.url,
        description: project.description,
        topics: project.topics ?? [],
        languages: project.languages,
        createdAt: project.createdAt,
        lastActiveAt: project.lastActiveAt,
        totalCommits: project.totalCommits,
        recentCommits: (project.recentCommits ?? []).slice(0, 10),
    };
}