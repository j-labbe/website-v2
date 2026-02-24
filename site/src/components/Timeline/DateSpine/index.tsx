import { useState, useMemo, useSyncExternalStore } from "react";
import DateItem from "./DateItem";
import type { DateSpineProps } from "./types";
import { buildSpineItems } from "./utils";

const mobileQuery = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
    const mql = window.matchMedia(mobileQuery);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(mobileQuery).matches;
const getServerSnapshot = () => false;

export function DateSpine({ months, activeMonth }: DateSpineProps) {
    const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
    const [spineHovered, setSpineHovered] = useState(false);

    const items = useMemo(() => buildSpineItems(months), [months]);

    const handleClick = (key: string) =>
        document.getElementById("month-" + key)?.scrollIntoView({ behavior: "smooth" });

    return (
        <nav
            aria-label="Timeline navigation"
            className="sticky top-20 self-start h-fit"
            onMouseEnter={() => !isMobile && setSpineHovered(true)}
            onMouseLeave={() => {
                if (!isMobile) {
                    setSpineHovered(false);
                    setHoveredMonthIndex(null);
                }
            }}
        >
            <ul className="flex flex-col items-end gap-[3px]">
                {items.map((item) => (
                    <DateItem
                        key={item.type === "year" ? `year-${item.year}` : item.key}
                        type={item.type}
                        label={item.type === "year" ? item.year : item.label}
                        itemIndex={item.type === "month" ? item.monthIndex : -1}
                        hoveredIndex={isMobile ? null : hoveredMonthIndex}
                        isActive={item.type === "month" && item.key === activeMonth}
                        timelineHover={isMobile || spineHovered}
                        isMobile={isMobile}
                        onClick={() => {
                            if (item.type === "month") handleClick(item.key);
                        }}
                        onHover={() => {
                            if (!isMobile && item.type === "month") setHoveredMonthIndex(item.monthIndex);
                        }}
                        onLeave={() => !isMobile && setHoveredMonthIndex(null)}
                    />
                ))}
            </ul>
        </nav>
    );
}
