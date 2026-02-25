import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useMemo } from "react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
    children: ReactNode;
    scrollContainerRef?: RefObject<HTMLElement>;
    enableBlur?: boolean;
    baseOpacity?: number;
    baseRotation?: number;
    blurStrength?: number;
    baseTranslateY?: number;
    containerClassName?: string;
    textClassName?: string;
    rotationEnd?: string;
    wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    scrollContainerRef,
    enableBlur = true,
    baseOpacity = 0.1,
    baseRotation = 3,
    blurStrength = 4,
    baseTranslateY = 0,
    containerClassName = "",
    textClassName = "",
    rotationEnd = "bottom bottom",
    wordAnimationEnd = "bottom bottom",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isTextMode = typeof children === "string";

    const splitText = useMemo(() => {
        if (!isTextMode) return null;
        return (children as string).split(/(\s+)/).map((word, index) => {
            if (word.match(/^\s+$/)) return word;
            return (
                <span className="inline-block word" key={index}>
                    {word}
                </span>
            );
        });
    }, [children, isTextMode]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

        const triggers: ScrollTrigger[] = [];

        // Rotation animation on the container
        const rotationTween = gsap.fromTo(
            el,
            { transformOrigin: "0% 50%", rotate: baseRotation },
            {
                ease: "none",
                rotate: 0,
                scrollTrigger: {
                    trigger: el,
                    scroller,
                    start: "top bottom",
                    end: rotationEnd,
                    scrub: true,
                },
            },
        );
        if (rotationTween.scrollTrigger) triggers.push(rotationTween.scrollTrigger);

        // In text mode, animate individual words; in element mode, animate the container
        const targets = isTextMode ? el.querySelectorAll<HTMLElement>(".word") : el;

        const opacityTween = gsap.fromTo(
            targets,
            {
                opacity: baseOpacity,
                willChange: "opacity, filter, transform",
                ...(!isTextMode && baseTranslateY ? { y: baseTranslateY } : {}),
            },
            {
                ease: "none",
                opacity: 1,
                ...(!isTextMode && baseTranslateY ? { y: 0 } : {}),
                stagger: isTextMode ? 0.05 : 0,
                scrollTrigger: {
                    trigger: el,
                    scroller,
                    start: isTextMode ? "top bottom-=10%" : "top bottom",
                    end: isTextMode ? wordAnimationEnd : "top 75%",
                    scrub: true,
                },
            },
        );
        if (opacityTween.scrollTrigger) triggers.push(opacityTween.scrollTrigger);

        if (enableBlur) {
            const blurTween = gsap.fromTo(
                targets,
                { filter: `blur(${blurStrength}px)` },
                {
                    ease: "none",
                    filter: "none",
                    stagger: isTextMode ? 0.05 : 0,
                    scrollTrigger: {
                        trigger: el,
                        scroller,
                        start: isTextMode ? "top bottom-=10%" : "top bottom",
                        end: isTextMode ? wordAnimationEnd : "top 75%",
                        scrub: true,
                    },
                },
            );
            if (blurTween.scrollTrigger) triggers.push(blurTween.scrollTrigger);
        }

        return () => {
            triggers.forEach((t) => t.kill());
        };
    }, [
        scrollContainerRef,
        enableBlur,
        baseRotation,
        baseOpacity,
        rotationEnd,
        wordAnimationEnd,
        blurStrength,
        baseTranslateY,
        isTextMode,
    ]);

    if (isTextMode) {
        return (
            <h2 ref={containerRef} className={`my-5 ${containerClassName}`}>
                <p className={`text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${textClassName}`}>
                    {splitText}
                </p>
            </h2>
        );
    }

    return (
        <div ref={containerRef} className={containerClassName}>
            {children}
        </div>
    );
};

export default ScrollReveal;
