import { useState, useCallback } from 'react';

interface DateSpineProps {
  months: { key: string; label: string }[];
  activeMonth: string | null;
}

/** Extract short month name from "February 2026" → "Feb" */
function shortMonth(label: string): string {
  return label.split(' ')[0].slice(0, 3);
}

/** Extract year from key "2026-02" → "2026" */
function yearFromKey(key: string): string {
  return key.split('-')[0];
}

/** Check if this month is the first of its year in the list */
function isYearBoundary(key: string, index: number, months: { key: string }[]): boolean {
  if (index === 0) return true;
  return yearFromKey(key) !== yearFromKey(months[index - 1].key);
}

/** Dock-style magnification: items near the hovered index scale up */
function getScale(index: number, hoveredIndex: number | null): number {
  if (hoveredIndex === null) return 1;
  const distance = Math.abs(index - hoveredIndex);
  if (distance === 0) return 1.35;
  if (distance === 1) return 1.15;
  return 1;
}

export function DateSpine({ months, activeMonth }: DateSpineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [spineHovered, setSpineHovered] = useState(false);

  function handleClick(key: string) {
    document.getElementById('month-' + key)?.scrollIntoView({ behavior: 'smooth' });
  }

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  return (
    <nav
      aria-label="Timeline navigation"
      className="sticky top-20 self-start h-fit"
      onMouseEnter={() => setSpineHovered(true)}
      onMouseLeave={() => { setSpineHovered(false); setHoveredIndex(null); }}
    >
      <ul className="flex flex-col items-end gap-1">
        {months.map(({ key, label }, index) => {
          const isActive = 'month-' + key === activeMonth;
          const scale = getScale(index, hoveredIndex);
          const showYear = isYearBoundary(key, index, months);
          const isHovered = hoveredIndex === index;

          return (
            <li key={key} className="flex items-center gap-2">
              {/* Month label — visible on spine hover */}
              <span
                className={`text-xs font-mono whitespace-nowrap transition-all duration-150 ${
                  isHovered ? 'text-text-bright opacity-100' :
                  isActive ? 'text-accent opacity-100' :
                  spineHovered ? 'text-text-dim opacity-70' : 'opacity-0'
                } ${spineHovered ? 'translate-x-0' : 'translate-x-2'}`}
              >
                {shortMonth(label)}
              </span>

              {/* Rounded rectangle bar */}
              <button
                onClick={() => handleClick(key)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                className="relative flex items-center"
                aria-label={label}
              >
                <div
                  className={`rounded-[4px] transition-all duration-150 ${
                    isActive ? 'bg-accent' :
                    isHovered ? 'bg-text-bright' :
                    'bg-border'
                  }`}
                  style={{
                    width: `${scale * 24}px`,
                    height: `${scale * 6}px`,
                  }}
                />
              </button>

              {/* Year label — always visible at year boundaries */}
              {showYear && !spineHovered && (
                <span className="absolute right-0 translate-x-[calc(100%+8px)] text-[10px] font-mono text-text-dim whitespace-nowrap">
                  {yearFromKey(key)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
