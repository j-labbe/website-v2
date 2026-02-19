export interface PipelineMeta {
  /** ISO 8601 timestamp of last successful pipeline run */
  lastUpdated: string;
  status: 'ok' | 'error';
  /** Error message if status is 'error' */
  error?: string;
  /** ISO 8601 timestamp of when the error occurred */
  errorAt?: string;
  projectCount: number;
  publicCount: number;
  privateCount: number;
}
