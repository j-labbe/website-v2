import { useCallback, useRef } from "react";

const MAX_DEGREES = 17;
const SCALE = 1.05;

export function useTilt<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateX = (0.5 - y) * MAX_DEGREES * -1;
        const rotateY = (x - 0.5) * MAX_DEGREES * -1;
        el.style.transform = `perspective(400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${SCALE})`;
    }, []);

    const onMouseLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.transform = "";
    }, []);

    return { ref, onMouseMove, onMouseLeave };
}
