import type { PipelineMeta } from '@jacklabbe/shared';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Determine if a full backfill is needed based on the current R2 meta state.
 *
 * Returns true if:
 * - meta is null (no meta.json in R2, first run)
 * - meta.lastUpdated is older than 48 hours
 *
 * Returns false otherwise (incremental update is sufficient).
 */
export function isBackfillNeeded(meta: PipelineMeta | null): boolean {
  if (meta === null) {
    return true;
  }

  const lastUpdated = new Date(meta.lastUpdated).getTime();
  const now = Date.now();
  const elapsed = now - lastUpdated;

  return elapsed > FORTY_EIGHT_HOURS_MS;
}
