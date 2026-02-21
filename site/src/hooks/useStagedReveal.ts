import { useEffect, useState } from "react";

export type Phase = "blank" | "skeleton" | "ready";

const SKELETON_TIMEOUT = 2000;
const STAGGER_DELAY = 50;

interface StagedRevealResult {
    phase: Phase;
    isVisible: (index: number) => boolean;
}

export function useStagedReveal(
    isReady: boolean,
    itemCount: number,
): StagedRevealResult {
    const [phase, setPhase] = useState<Phase>("blank");
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        if (isReady) {
            setPhase("ready");
            return;
        }

        const timer = setTimeout(() => {
            setPhase((prev) => (prev === "blank" ? "skeleton" : prev));
        }, SKELETON_TIMEOUT);

        return () => clearTimeout(timer);
    }, [isReady]);

    useEffect(() => {
        if (phase !== "ready" || visibleCount >= itemCount) return;

        const timer = setTimeout(() => {
            setVisibleCount((c) => c + 1);
        }, STAGGER_DELAY);

        return () => clearTimeout(timer);
    }, [phase, visibleCount, itemCount]);

    return {
        phase,
        isVisible: (index: number) => visibleCount > index,
    };
}
