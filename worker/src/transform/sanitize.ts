import { createHash } from 'node:crypto';
import type { ProjectEntry } from '@jacklabbe/shared';

/**
 * Raw GitHub repo shape relevant to sanitization.
 * This is a subset of the GitHub REST API response.
 */
export interface RawGitHubRepo {
  id: number;
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  parent: {
    full_name: string;
    html_url: string;
    private: boolean;
  } | null;
  created_at: string;
  pushed_at: string;
  topics?: string[];
}

/**
 * Sanitize a private repo into a ProjectEntry with ONLY allowed fields.
 *
 * PRIVACY BOUNDARY: This function constructs the output object field-by-field
 * using an explicit allowlist. It NEVER spreads or copies raw API data.
 *
 * Allowed fields: id (hashed), name ("Private Repo"), isPrivate, isFork,
 * parentRepo (only if parent is public), languages (names only),
 * createdAt, lastActiveAt, monthlyCommits, totalCommits.
 *
 * MUST NOT include: url, description, topics, recentCommits, or any
 * field that could reveal the repo's identity.
 */
export function sanitizePrivateRepo(
  raw: RawGitHubRepo,
  monthlyCommits: Record<string, number>,
  languages: Record<string, number>,
): ProjectEntry {
  const id = createHash('sha256')
    .update(raw.full_name)
    .digest('hex')
    .slice(0, 16);

  const parentRepo =
    raw.fork && raw.parent && !raw.parent.private
      ? { name: raw.parent.full_name, url: raw.parent.html_url }
      : null;

  return {
    id,
    name: 'Private Repo',
    isPrivate: true,
    isFork: raw.fork,
    parentRepo,
    languages: Object.keys(languages),
    createdAt: raw.created_at.slice(0, 10),
    lastActiveAt: raw.pushed_at.slice(0, 10),
    monthlyCommits,
    totalCommits: Object.values(monthlyCommits).reduce((a, b) => a + b, 0),
  };
}
