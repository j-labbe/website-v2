import { SquircleClipDef } from './SquircleClipDef';

/**
 * LQIP placeholder for the skeleton: same base64 gradient as Hero.tsx.
 * Shows the blurred placeholder in the squircle shape while the page skeleton loads.
 */
const LQIP_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyNSI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzBhMTYyOCIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMTExZDMzIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDQwZDIxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjI1IiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

export function HeroSkeleton() {
  return (
    <section className="bg-[radial-gradient(ellipse_at_70%_50%,var(--color-accent-glow),var(--color-bg)_70%)] py-20">
      <SquircleClipDef />
      <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-16 max-md:flex-col max-md:text-center">
        <div className="shrink-0 max-w-80 w-1/2 max-md:max-w-[200px] max-md:mx-auto max-md:w-full">
          <div
            className="lqip-container aspect-[4/5]"
            style={{ clipPath: 'url(#squircle-clip)' }}
          >
            <img
              src={LQIP_PLACEHOLDER}
              alt=""
              aria-hidden="true"
              className="lqip-placeholder"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-3 max-md:items-center">
          <div className="w-3/5 h-16 rounded-lg skeleton" />
          <div className="w-2/5 h-5 rounded-lg skeleton" />
          <div className="w-[120px] h-12 rounded-full mt-2 skeleton" />
        </div>
      </div>
    </section>
  );
}
