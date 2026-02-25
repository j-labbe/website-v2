import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "webmcp-banner-dismissed";

export const Banner: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show if not previously dismissed
        if (!localStorage.getItem(STORAGE_KEY)) {
            setVisible(true);
        }
    }, []);

    const dismiss = useCallback(() => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, "1");
    }, []);

    if (!visible) return null;

    return (
        <div className="relative z-110 w-full border-b border-border bg-surface/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-[1200px] items-center justify-center px-8 py-2 text-sm font-sans text-text-dim">
                <p className="m-0 text-center">
                    This site is <span className="font-semibold text-accent">WebMCP</span>-enabled! AI agents can
                    interact with it directly.
                </p>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss banner"
                    className="absolute right-4 flex h-6 w-6 items-center justify-center rounded-full text-text-dim transition-colors duration-150 hover:bg-surface-2 hover:text-text cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
