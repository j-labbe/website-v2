import { useState } from 'react';
import { HeroSkeleton } from './HeroSkeleton';
import { SquircleClipDef } from './SquircleClipDef';

/**
 * LQIP placeholder: a tiny base64-encoded dark gradient image used as
 * a blurred placeholder while the full-resolution headshot loads.
 *
 * To generate a proper LQIP from the actual headshot:
 *   1. Resize headshot.webp to ~20x25px
 *   2. Convert to base64: `base64 -w0 headshot-lqip.webp`
 *   3. Replace this data URI with: `data:image/webp;base64,<output>`
 */
const LQIP_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyNSI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzBhMTYyOCIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMTExZDMzIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDQwZDIxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjI1IiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

interface HeroProps {
  isLoading: boolean;
}

export function Hero({ isLoading }: HeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (isLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section className="bg-[radial-gradient(ellipse_at_70%_50%,var(--color-accent-glow),var(--color-bg)_70%)] py-20">
      <SquircleClipDef />
      <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-16 max-md:flex-col max-md:text-center">
        <div
          className="shrink-0 max-w-80 w-1/2 max-md:max-w-[200px] max-md:mx-auto max-md:w-full stagger-item"
          style={{ '--stagger-index': 0 } as React.CSSProperties}
        >
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
            <img
              src="/headshot.webp"
              alt="Jack Labbe"
              className={`lqip-full${imageLoaded ? ' loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col max-md:items-center">
          <h1
            className="font-sans font-bold text-[4rem] text-text-bright leading-[1.1] max-md:text-5xl stagger-item"
            style={{ '--stagger-index': 1 } as React.CSSProperties}
          >
            Jack Labbe
          </h1>
          <p
            className="font-sans font-light text-xl text-text mt-3 stagger-item"
            style={{ '--stagger-index': 2 } as React.CSSProperties}
          >
            Software / AI Engineer
          </p>
          <a
            href="mailto:contact@jacklabbe.com"
            className="inline-flex items-center justify-center px-8 py-3 bg-accent text-bg rounded-full font-sans font-semibold text-base no-underline mt-6 w-fit transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-accent-secondary focus-visible:outline-offset-2 stagger-item"
            style={{ '--stagger-index': 3 } as React.CSSProperties}
          >
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}
