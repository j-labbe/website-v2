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

/**
 * Dock-style magnification with smooth falloff.
 * Returns scale (1..1.5) and brightness (0..1) based on distance from hovered.
 * Each step away is another gradual reduction — not a hard cutoff.
 */
function getMagnification(index: number, hoveredIndex: number | null): { scale: number; brightness: number } {
  if (hoveredIndex === null) return { scale: 1, brightness: 0 };
  const distance = Math.abs(index - hoveredIndex);
  // Smooth gaussian-ish falloff over 4 steps
  const falloff = Math.exp(-(distance * distance) / 3);
  return {
    scale: 1 + 0.5 * falloff,       // 1.0 → 1.5 at center
    brightness: falloff,              // 1.0 → 0 smooth fade
  };
}

/** Interpolate between two hex colors */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

const COLOR_DIM = '#1a2844';    // --color-border
const COLOR_BRIGHT = '#f0f6fc'; // --color-text-bright
const COLOR_ACCENT = '#4F7DF5'; // --color-accent

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
      <ul className="flex flex-col items-end gap-[3px]">
        {months.map(({ key, label }, index) => {
          const isActive = 'month-' + key === activeMonth;
          const { scale, brightness } = getMagnification(index, hoveredIndex);

          // Bar color: active = accent, otherwise interpolate dim→bright based on proximity
          const barColor = isActive
            ? lerpColor(COLOR_ACCENT, COLOR_BRIGHT, brightness * 0.4)
            : lerpColor(COLOR_DIM, COLOR_BRIGHT, brightness);

          // Month label opacity follows the same falloff
          const labelOpacity = spineHovered ? 0.3 + brightness * 0.7 : 0;
          const labelColor = isActive ? COLOR_ACCENT : lerpColor('#6e7a8a', COLOR_BRIGHT, brightness);

          return (
            <li key={key} className="flex items-center gap-2 justify-end">
              {/* Month label — fades in on spine hover, brightness follows magnification */}
              <span
                className="text-xs font-mono whitespace-nowrap"
                style={{
                  opacity: labelOpacity,
                  color: labelColor,
                  transform: spineHovered ? 'translateX(0)' : 'translateX(4px)',
                  transition: 'all 150ms ease-out',
                }}
              >
                {shortMonth(label)}
              </span>

              {/* Rounded rectangle selector */}
              <button
                onClick={() => handleClick(key)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                className="relative flex items-center justify-end"
                aria-label={label}
              >
                <div
                  className="rounded-[4px]"
                  style={{
                    width: `${scale * 24}px`,
                    height: `${scale * 6}px`,
                    backgroundColor: barColor,
                    transition: 'all 150ms ease-out',
                  }}
                />
              </button>
            </li>
          );
        })}

        {/* Year labels — shown inline below each year's last month when not hovered */}
        {!spineHovered && (
          <li className="sr-only" aria-hidden="true" />
        )}
      </ul>

      {/* Year markers overlaid at year boundaries when spine is not hovered */}
      {!spineHovered && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-end gap-[3px]">
          {months.map(({ key }, index) => {
            const showYear = isYearBoundary(key, index, months);
            return (
              <div
                key={key}
                className="flex items-center justify-end"
                style={{ height: '9px' }} // matches 6px bar + 3px gap
              >
                {showYear && (
                  <span className="text-[10px] font-mono text-text-dim pr-1">
                    {yearFromKey(key)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}
