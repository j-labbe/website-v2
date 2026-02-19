/** Daily contribution counts for the commit heatmap */
export interface GraphData {
  /** Daily contribution entries */
  days: ContributionDay[];
  totalContributions: number;
  /** ISO 8601 date string of the earliest day in the range */
  rangeStart: string;
  /** ISO 8601 date string of the latest day in the range */
  rangeEnd: string;
}

export interface ContributionDay {
  /** "YYYY-MM-DD" */
  date: string;
  /** Total contributions (commits, PRs, issues, reviews) */
  count: number;
  /** 0-4 intensity level */
  level: 0 | 1 | 2 | 3 | 4;
}
