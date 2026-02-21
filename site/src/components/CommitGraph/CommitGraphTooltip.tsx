import { useRef, useLayoutEffect, useState, type RefObject } from 'react';

interface CommitGraphTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function CommitGraphTooltip({ visible, x, y, text, containerRef }: CommitGraphTooltipProps) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [clampedX, setClampedX] = useState(x);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    const container = containerRef.current;
    if (!tip || !container || !visible) return;

    const tipWidth = tip.offsetWidth;
    const containerWidth = container.offsetWidth;
    const half = tipWidth / 2;

    // Clamp so tooltip stays within container bounds with 8px padding
    const minX = half + 8;
    const maxX = containerWidth - half - 8;
    setClampedX(Math.max(minX, Math.min(maxX, x)));
  }, [x, visible, text, containerRef]);

  if (!visible) return null;

  return (
    <div
      ref={tipRef}
      className="absolute pointer-events-none bg-surface-2 border border-border text-text text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-10"
      style={{
        left: clampedX,
        top: y - 40,
        transform: 'translateX(-50%)',
      }}
    >
      {text}
    </div>
  );
}
