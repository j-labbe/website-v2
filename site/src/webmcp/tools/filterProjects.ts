import type { ProjectEntry } from "@jacklabbe/shared";
import { MONTH_KEY_RE } from "../constants";
import toPublicProject from "./toPublicProject";

export default function filterProjects(projects: ProjectEntry[], input: Record<string, unknown>) {
    const monthKey = typeof input.monthKey === "string" ? input.monthKey : null;
    const language = typeof input.language === "string" ? input.language.toLowerCase() : null;
    const visibility = input.visibility === "public" || input.visibility === "private" ? input.visibility : null;
    const minCommits = typeof input.minCommits === "number" ? input.minCommits : 0;
    const requestedMax = typeof input.maxResults === "number" ? input.maxResults : 20;
    const maxResults = Math.min(Math.max(1, requestedMax), 50);

    let filtered = projects;

    if (monthKey && MONTH_KEY_RE.test(monthKey)) {
        filtered = filtered.filter((project) => (project.monthlyCommits[monthKey] ?? 0) > 0);
    }

    if (language) {
        filtered = filtered.filter((project) => project.languages.some((entry) => entry.toLowerCase() === language));
    }

    if (visibility === "public") {
        filtered = filtered.filter((project) => !project.isPrivate);
    }

    if (visibility === "private") {
        filtered = filtered.filter((project) => project.isPrivate);
    }

    filtered = filtered
        .filter((project) => project.totalCommits >= minCommits)
        .sort((left, right) => right.totalCommits - left.totalCommits)
        .slice(0, maxResults);

    return filtered.map(toPublicProject);
}