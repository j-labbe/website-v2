/**
 * Internal types for raw GitHub API responses.
 * These represent the raw API shape before transformation into shared types.
 */

// -- GraphQL contribution calendar types --

export interface GitHubContributionDay {
  contributionCount: number;
  contributionLevel: string;
  date: string;
}

export interface GitHubContributionWeek {
  contributionDays: GitHubContributionDay[];
}

export interface GitHubContributionCalendar {
  totalContributions: number;
  weeks: GitHubContributionWeek[];
}

export interface GitHubContributionResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: GitHubContributionCalendar;
    };
  };
}

// -- REST repo types --

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  description: string | null;
  language: string | null;
  created_at: string;
  pushed_at: string;
  parent?: {
    full_name: string;
    html_url: string;
    private: boolean;
  };
}

// -- REST commit types --

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

export interface GitHubCommitDetail {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  stats: {
    additions: number;
    deletions: number;
  };
}
