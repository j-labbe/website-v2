import type { ProjectEntry } from "@jacklabbe/shared";
import toPublicProject from "./toPublicProject";

export default function getSkillEvidence(projects: ProjectEntry[], skillRaw: string) {
    const skill = skillRaw.trim().toLowerCase();

    return projects
        .map((project) => {
            let score = 0;

            if (project.languages.some((language) => language.toLowerCase().includes(skill))) score += 3;
            if ((project.topics ?? []).some((topic) => topic.toLowerCase().includes(skill))) score += 2;
            if ((project.description ?? "").toLowerCase().includes(skill)) score += 2;
            if (project.name.toLowerCase().includes(skill)) score += 1;
            if ((project.recentCommits ?? []).some((commit) => commit.message.toLowerCase().includes(skill)))
                score += 2;

            return { score, project };
        })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 5)
        .map((entry) => ({
            score: entry.score,
            project: toPublicProject(entry.project),
        }));
}