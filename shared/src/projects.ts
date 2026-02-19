export interface ProjectEntry {
  /** Stable ID: SHA-256 hash prefix for private, GitHub ID string for public */
  id: string;
  /** "Private Repo" for private repos */
  name: string;
  isPrivate: boolean;
  isFork: boolean;
  /** Only populated for public forks (or private forks with public parent) */
  parentRepo: { name: string; url: string } | null;
  /** Language names (e.g., ["TypeScript", "Python"]) */
  languages: string[];
  /** "YYYY-MM-DD" */
  createdAt: string;
  /** "YYYY-MM-DD" */
  lastActiveAt: string;
  /** Per-month commit counts: { "2026-01": 15, "2026-02": 8 } */
  monthlyCommits: Record<string, number>;
  totalCommits: number;
  /** GitHub URL -- public repos only */
  url?: string;
  /** Repository description -- public repos only */
  description?: string;
  /** Repository topics -- public repos only */
  topics?: string[];
  /** Rich commit data for v2 (messages, diff stats) -- public repos only */
  recentCommits?: CommitDetail[];
}

export interface CommitDetail {
  sha: string;
  message: string;
  /** "YYYY-MM-DD" */
  date: string;
  additions: number;
  deletions: number;
}

export interface ProjectsFile {
  projects: ProjectEntry[];
}
