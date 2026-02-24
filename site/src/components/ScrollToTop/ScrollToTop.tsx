import { useState, useEffect } from "react";
import { IoCaretUp } from "react-icons/io5";

export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onScroll() {
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
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
            <IoCaretUp size={20} />
        </button>
    );
}
