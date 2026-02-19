import type { PipelineMeta } from '@jacklabbe/shared';

// Cross-package type import proves workspace resolution works
const _typeCheck: PipelineMeta | null = null;
void _typeCheck;

interface Env {
  R2_BUCKET: R2Bucket;
  GITHUB_TOKEN: string;
  REFRESH_SECRET: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    _env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    console.log('Pipeline triggered (cron)');
    // Stub -- pipeline implementation in subsequent plans
  },

  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.REFRESH_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Pipeline triggered (manual)');
    // Stub -- pipeline implementation in subsequent plans
    return new Response('Pipeline triggered', { status: 202 });
  },
};
