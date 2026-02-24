import { useCallback, useEffect, useRef, useState } from "react";

const ABOUT_TEXT = [
    "I'm a software engineer who turns complex problems into elegant, intelligent systems. I work across data, AI, and full stack engineering, building everything from search platforms and custom tooling to iOS apps that people actually use.",
    "Currently I'm experimenting with what AI can do in production; things like fine-tuning tone and output in large-scale LLM deployments to building APIs that connect MCP servers and semantic search for seamless chat experiences.",
    "Feel free to check out my projects below, or reach out if you want to chat about anything!",
];
const WORD_DELAY_MS = 50;

export const About = () => {
    const [inView, setInView] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const aboutParagraphLengths = ABOUT_TEXT.map((p) => p.split(" ").filter(Boolean).length);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // When animation ends on a word, strip the animation and set final styles directly.
    // This forces Safari/WebKit to tear down the compositing layer created for the
    // blur filter, which otherwise causes text to stay blurry.
    const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLSpanElement>) => {
        const el = e.currentTarget;
        el.classList.remove("animate-stream-word", "opacity-0");
        el.style.animation = "none";
        el.style.opacity = "1";
        el.style.filter = "";
        el.style.translate = "";
    }, []);

    return (
        <div ref={containerRef} className="mb-8">
            {ABOUT_TEXT.map((paragraph, index) => {
                const priorWordCount = aboutParagraphLengths.slice(0, index).reduce((a, b) => a + b, 0);

                return (
                    <p
                        key={index}
                        className={`text-lg leading-relaxed text-text max-w-5xl ${index !== 0 ? "mt-4" : ""}`}
                    >
                        <span>
                            {paragraph
                                .split(" ")
                                .filter(Boolean)
                                .map((word, i) => {
                                    const animationDelay = (priorWordCount + i) * WORD_DELAY_MS;

                                    return (
                                        <span
                                            key={i}
                                            className={`opacity-0 ${inView ? "animate-stream-word" : ""}`}
                                            style={
                                                inView
                                                    ? {
                                                          animationDelay: `${animationDelay}ms`,
                                                      }
                                                    : undefined
                                            }
                                            onAnimationEnd={handleAnimationEnd}
                                        >
                                            {word}{" "}
                                        </span>
                                    );
                                })}
                        </span>
                    </p>
                );
            })}

            {/* Blinking cursor: hidden until all words have animated */}
            {/* <span
                className={`inline-block w-[2px] h-[1.1em] rounded-sm bg-accent align-middle ${showCursor ? "opacity-100 animate-blink-cursor" : "opacity-0"}`}
            /> */}
        </div>
    );
};
