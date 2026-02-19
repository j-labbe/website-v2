import { runPipeline } from './pipeline.js';

interface Env {
  R2_BUCKET: R2Bucket;
  GITHUB_TOKEN: string;
  REFRESH_SECRET: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log(JSON.stringify({ stage: 'cron-triggered', ts: Date.now() }));
    ctx.waitUntil(runPipeline(env));
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Only POST triggers pipeline refresh
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Bearer token auth
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.REFRESH_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check for explicit backfill parameter
    const url = new URL(request.url);
    const forceBackfill = url.searchParams.get('backfill') === 'true';

    // Trigger pipeline (non-blocking via waitUntil)
    ctx.waitUntil(runPipeline(env, forceBackfill));
    return new Response(
      JSON.stringify({ status: 'triggered', backfill: forceBackfill }),
      { status: 202, headers: { 'Content-Type': 'application/json' } },
    );
  },
};
