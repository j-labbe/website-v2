import type {
  GraphData,
  ProjectEntry,
  PipelineMeta,
} from '@jacklabbe/shared';

/**
 * Read the current pipeline metadata from R2.
 * Returns null if meta.json does not exist (signals backfill needed).
 */
export async function readMeta(
  bucket: R2Bucket,
): Promise<PipelineMeta | null> {
  const obj = await bucket.get('meta.json');
  if (!obj) {
    return null;
  }
  return obj.json<PipelineMeta>();
}

/**
 * Write all pipeline results to R2 atomically.
 *
 * Write order matters: graph.json first, projects.json second,
 * meta.json LAST. meta.json acts as the "commit" signal -- if
 * the pipeline crashes mid-write, the old meta.json still points
 * to the previous consistent state.
 */
export async function writePipelineResults(
  bucket: R2Bucket,
  graph: GraphData,
  projects: ProjectEntry[],
): Promise<void> {
  const now = new Date().toISOString();

  const publicCount = projects.filter((p) => !p.isPrivate).length;
  const privateCount = projects.filter((p) => p.isPrivate).length;

  // Write graph.json first
  await bucket.put('graph.json', JSON.stringify(graph), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
  });

  // Write projects.json second
  await bucket.put('projects.json', JSON.stringify({ projects }), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
  });

  // Write meta.json LAST (the "commit" signal)
  const meta: PipelineMeta = {
    lastUpdated: now,
    status: 'ok',
    projectCount: projects.length,
    publicCount,
    privateCount,
  };

  await bucket.put('meta.json', JSON.stringify(meta), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=3600',
    },
  });
}

/**
 * Write error metadata to R2 while preserving existing data.
 *
 * On pipeline failure: graph.json and projects.json remain from
 * the last successful run. Only meta.json is updated to signal
 * the error state with a shorter cache TTL.
 */
export async function writeErrorMeta(
  bucket: R2Bucket,
  error: string,
): Promise<void> {
  // Read existing meta to preserve lastUpdated from last success
  const existing = await bucket.get('meta.json');
  const prev = existing
    ? await existing.json<PipelineMeta>()
    : ({} as Partial<PipelineMeta>);

  const meta: PipelineMeta = {
    lastUpdated: prev.lastUpdated ?? new Date().toISOString(),
    status: 'error',
    error,
    errorAt: new Date().toISOString(),
    projectCount: prev.projectCount ?? 0,
    publicCount: prev.publicCount ?? 0,
    privateCount: prev.privateCount ?? 0,
  };

  await bucket.put('meta.json', JSON.stringify(meta), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=300', // shorter cache on error
    },
  });
}
