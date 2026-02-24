import type { ProjectEntry, CommitDetail } from "@jacklabbe/shared";
import type { RawGitHubRepo } from "../sanitize";
import { sanitizePrivateRepo } from "../sanitize";

/**
 * Transform a raw GitHub repo into a ProjectEntry.
 *
 * For public repos: includes all fields (url, description, topics, recentCommits).
 * For private repos: delegates to sanitizePrivateRepo (privacy boundary).
 */
export default function transformRepo(
    raw: RawGitHubRepo,
    monthlyCommits: Record<string, number>,
    languages: Record<string, number>,
    recentCommits?: CommitDetail[],
): ProjectEntry {
    // Private repos go through the sanitization boundary
    if (raw.private) {
        return sanitizePrivateRepo(raw, monthlyCommits, languages);
    }

    // Public repos get the full ProjectEntry with all fields
    const totalCommits = Object.values(monthlyCommits).reduce((a, b) => a + b, 0);

    const parentRepo = raw.fork && raw.parent ? { name: raw.parent.full_name, url: raw.parent.html_url } : null;

    return {
        id: String(raw.id),
        name: raw.name,
        isPrivate: false,
        isFork: raw.fork,
        parentRepo,
        languages: Object.keys(languages),
        createdAt: raw.created_at.slice(0, 10),
        lastActiveAt: raw.pushed_at.slice(0, 10),
        monthlyCommits,
        totalCommits,
        url: raw.html_url,
        description: raw.description ?? undefined,
        topics: raw.topics ?? undefined,
        recentCommits,
    };
}
