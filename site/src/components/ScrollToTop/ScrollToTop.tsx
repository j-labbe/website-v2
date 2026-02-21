import { useState, useEffect } from "react";

/**
 * Fixed scroll-to-top button that appears once the user scrolls
 * past a threshold. Positioned bottom-right, inset from the page
 * edge so it aligns with the 1200px content container and avoids
 * overlapping the timeline date spine.
 */
export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onScroll() {
            // Show after scrolling ~600px (roughly past hero + graph)
            setVisible(window.scrollY > 600);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-surface-2 border border-border text-text-dim transition-all duration-200 hover:text-accent hover:border-accent/50 ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M8 12V4M4 7l4-4 4 4" />
            </svg>
        </button>
    );
}
