import { getMagnification, lerpColor, shortMonth } from "./utils";
import { COLOR_ACCENT, COLOR_BRIGHT, COLOR_DIM } from "./constants";

const DateItem = ({ type, label, itemIndex, hoveredIndex, isActive, timelineHover, onClick, onHover, onLeave }: { type: string; label: string; itemIndex: number; hoveredIndex: number | null; isActive: boolean; timelineHover: boolean; onClick: () => void; onHover: () => void; onLeave: () => void }) => {
    const isYear = type === "year";

    if (isYear) {
        return (
            <li key={`year-${label}`} className="flex items-center justify-end py-0.5 cursor-default">
                <span className="text-[10px] font-mono text-text-dim">
                    {label}
                </span>
            </li>
        );
    }

    const { scale, brightness } = getMagnification(itemIndex, hoveredIndex);
    const barColor = isActive
        ? lerpColor(COLOR_ACCENT, COLOR_BRIGHT, brightness * 0.4)
        : lerpColor(COLOR_DIM, COLOR_BRIGHT, brightness);
    const labelOpacity = timelineHover ? 0.3 + brightness * 0.7 : 0;
    const labelColor = isActive ? COLOR_ACCENT : lerpColor("#6e7a8a", COLOR_BRIGHT, brightness);

    return (
        <li
            key={label}
            className="flex items-center gap-2 justify-end"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter") onClick();
            }}
            style={{ cursor: "pointer" }}
        >
            <span
                className="text-xs font-mono whitespace-nowrap"
                style={{
                    opacity: labelOpacity,
                    color: labelColor,
                    transform: timelineHover ? "translateX(0)" : "translateX(4px)",
                    transition: "all 150ms ease-out",
                }}
            >
                {shortMonth(label)}
            </span>

            <div
                className="rounded-full"
                style={{
                    width: `${scale * 24}px`,
                    height: `${scale * 6}px`,
                    backgroundColor: barColor,
                    transform: `scale(${0.5 + scale * 0.5})`,
                    transition: "all 150ms ease-out",
                }}
            />
        </li>
    );
}

export default DateItem;




