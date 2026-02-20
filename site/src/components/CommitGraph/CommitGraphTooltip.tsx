interface CommitGraphTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

export function CommitGraphTooltip({ visible, x, y, text }: CommitGraphTooltipProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none bg-surface-2 border border-border text-text text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-10"
      style={{
        left: x,
        top: y - 40,
        transform: 'translateX(-50%)',
      }}
    >
      {text}
    </div>
  );
}
