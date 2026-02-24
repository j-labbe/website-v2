import { useState, useMemo } from "react";
import DateItem from "./DateItem";
import type { DateSpineProps } from "./types";
import { buildSpineItems } from "./utils";

export function DateSpine({ months, activeMonth }: DateSpineProps) {
    const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
    const [spineHovered, setSpineHovered] = useState(false);

    const items = useMemo(() => buildSpineItems(months), [months]);

    const handleClick = (key: string) =>
        document.getElementById("month-" + key)?.scrollIntoView({ behavior: "smooth" });

    return (
        <nav
            aria-label="Timeline navigation"
            className="sticky top-20 self-start h-fit"
            onMouseEnter={() => setSpineHovered(true)}
            onMouseLeave={() => {
                setSpineHovered(false);
                setHoveredMonthIndex(null);
            }}
        >
            <ul className="flex flex-col items-end gap-[3px]">
                {items.map((item) => (
                    <DateItem
                        key={item.type === "year" ? `year-${item.year}` : item.key}
                        type={item.type}
                        label={item.type === "year" ? item.year : item.label}
                        itemIndex={item.type === "month" ? item.monthIndex : -1}
                        hoveredIndex={hoveredMonthIndex}
                        isActive={item.type === "month" && item.key === activeMonth}
                        timelineHover={spineHovered}
                        onClick={() => {
                            if (item.type === "month") handleClick(item.key);
                        }}
                        onHover={() => {
                            if (item.type === "month") setHoveredMonthIndex(item.monthIndex);
                        }}
                        onLeave={() => setHoveredMonthIndex(null)}
                    />
                ))}
            </ul>
        </nav>
    );
}
