import { HeroSkeleton } from './HeroSkeleton';

interface HeroProps {
  isLoading: boolean;
}

export function Hero({ isLoading }: HeroProps) {
  if (isLoading) {
    return <HeroSkeleton />;
  }

  return (
    <section className="bg-[radial-gradient(ellipse_at_70%_50%,var(--color-accent-glow),var(--color-bg)_70%)] py-20">
      <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-16 max-md:flex-col max-md:text-center">
        <div
          className="shrink-0 max-w-80 w-1/2 max-md:max-w-[200px] max-md:mx-auto max-md:w-full stagger-item"
          style={{ '--stagger-index': 0 } as React.CSSProperties}
        >
          <img
            src="/headshot.webp"
            alt="Jack Labbe"
            className="w-full rounded-lg object-cover aspect-[4/5]"
          />
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
