import type { Phase } from "../../hooks/useStagedReveal";
import { useTilt } from "../../hooks/useTilt";
import { crossfadeLayer, stagger } from "../../utils/stagger";
import { LqipImage } from "./LqipImage";

interface HeroProps {
    phase: Phase;
    isVisible: (index: number) => boolean;
}

export function Hero({ phase, isVisible }: HeroProps) {
    const tilt = useTilt<HTMLDivElement>();
    const ready = phase === "ready";

    return (
        <section className="bg-[radial-gradient(ellipse_at_70%_50%,var(--color-accent-glow),var(--color-bg)_70%)] py-20">
            <div className="max-w-[1200px] mx-auto px-8 flex items-center gap-16 max-md:flex-col max-md:text-center">
                <div
                    className={`shrink-0 max-w-80 w-1/2 max-md:max-w-[200px] max-md:mx-auto max-md:w-full ${stagger(isVisible(0))}`}
                >
                    <div
                        ref={tilt.ref}
                        className="lqip-container w-[300px] h-[250px] rounded-2xl overflow-hidden transition-[transform,filter] duration-300 ease-out hover:grayscale"
                        onMouseMove={tilt.onMouseMove}
                        onMouseLeave={tilt.onMouseLeave}
                    >
                        {phase === "skeleton" ? (
                            <div className="w-full h-full skeleton rounded-none" />
                        ) : (
                            <LqipImage src="/headshot.webp" alt="Jack Labbe" />
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col max-md:items-center relative">
                    {/* Skeleton */}
                    <div
                        className={`flex flex-col gap-3 max-md:items-center ${crossfadeLayer(phase === "skeleton")}`}
                    >
                        <div className="w-3/5 h-16 rounded-lg skeleton" />
                        <div className="w-2/5 h-5 rounded-lg skeleton" />
                        <div className="w-[120px] h-12 rounded-full mt-2 skeleton" />
                    </div>

                    {/* Content */}
                    <div
                        className={`flex flex-col max-md:items-center ${crossfadeLayer(ready)}`}
                    >
                        <h1
                            className={`font-sans font-bold text-[4rem] text-text-bright leading-[1.1] max-md:text-5xl ${stagger(isVisible(1))}`}
                        >
                            Jack Labbe
                        </h1>
                        <p
                            className={`font-sans font-light text-xl text-text mt-3 ${stagger(isVisible(2))}`}
                        >
                            Software / AI Engineer
                        </p>
                        <a
                            href="mailto:contact@jacklabbe.com"
                            className={`inline-flex items-center justify-center px-8 py-3 bg-accent text-bg rounded-full font-sans font-semibold text-base no-underline mt-6 w-fit hover:opacity-85 focus-visible:outline-2 focus-visible:outline-accent-secondary focus-visible:outline-offset-2 ${stagger(isVisible(3))}`}
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
