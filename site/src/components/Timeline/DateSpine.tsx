import { useState, useMemo } from 'react';

interface DateSpineProps {
  months: { key: string; label: string }[];
  activeMonth: string | null;
}

type SpineItem =
  | { type: 'year'; year: string }
  | { type: 'month'; key: string; label: string; monthIndex: number };

/** Extract short month name from "February 2026" → "Feb" */
function shortMonth(label: string): string {
  return label.split(' ')[0].slice(0, 3);
}

/** Extract year from key "2026-02" → "2026" */
function yearFromKey(key: string): string {
  return key.split('-')[0];
}

/**
 * Dock-style magnification with smooth gaussian falloff.
 * Each step away from hovered is another gradual reduction.
 */
function getMagnification(monthIndex: number, hoveredMonthIndex: number | null): { scale: number; brightness: number } {
  if (hoveredMonthIndex === null) return { scale: 1, brightness: 0 };
  const distance = Math.abs(monthIndex - hoveredMonthIndex);
  const falloff = Math.exp(-(distance * distance) / 3);
  return {
    scale: 1 + 0.5 * falloff,
    brightness: falloff,
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

const COLOR_DIM = '#1a2844';
const COLOR_BRIGHT = '#f0f6fc';
const COLOR_ACCENT = '#4F7DF5';

/** Build a flat list interleaving year separators and month items */
function buildSpineItems(months: { key: string; label: string }[]): SpineItem[] {
  const items: SpineItem[] = [];
  let lastYear = '';
  let monthIndex = 0;

  for (const { key, label } of months) {
    const year = yearFromKey(key);
    if (year !== lastYear) {
      items.push({ type: 'year', year });
      lastYear = year;
    }
    items.push({ type: 'month', key, label, monthIndex });
    monthIndex++;
  }

  return items;
}

export function DateSpine({ months, activeMonth }: DateSpineProps) {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [spineHovered, setSpineHovered] = useState(false);

  const items = useMemo(() => buildSpineItems(months), [months]);

  function handleClick(key: string) {
    document.getElementById('month-' + key)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <nav
      aria-label="Timeline navigation"
      className="sticky top-20 self-start h-fit"
      onMouseEnter={() => setSpineHovered(true)}
      onMouseLeave={() => { setSpineHovered(false); setHoveredMonthIndex(null); }}
    >
      <ul className="flex flex-col items-end gap-[3px]">
        {items.map((item) => {
          if (item.type === 'year') {
            return (
              <li key={`year-${item.year}`} className="flex items-center justify-end py-0.5">
                <span
                  className="text-[10px] font-mono text-text-dim"
                  style={{
                    opacity: spineHovered ? 0 : 1,
                    transition: 'opacity 150ms ease-out',
                  }}
                >
                  {item.year}
                </span>
              </li>
            );
          }

          const isActive = 'month-' + item.key === activeMonth;
          const { scale, brightness } = getMagnification(item.monthIndex, hoveredMonthIndex);

          const barColor = isActive
            ? lerpColor(COLOR_ACCENT, COLOR_BRIGHT, brightness * 0.4)
            : lerpColor(COLOR_DIM, COLOR_BRIGHT, brightness);

          const labelOpacity = spineHovered ? 0.3 + brightness * 0.7 : 0;
          const labelColor = isActive ? COLOR_ACCENT : lerpColor('#6e7a8a', COLOR_BRIGHT, brightness);

          return (
            <li
              key={item.key}
              className="flex items-center gap-2 justify-end"
              onMouseEnter={() => setHoveredMonthIndex(item.monthIndex)}
              onClick={() => handleClick(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClick(item.key); }}
              style={{ cursor: 'pointer' }}
            >
              {/* Month label */}
              <span
                className="text-xs font-mono whitespace-nowrap"
                style={{
                  opacity: labelOpacity,
                  color: labelColor,
                  transform: spineHovered ? 'translateX(0)' : 'translateX(4px)',
                  transition: 'all 150ms ease-out',
                }}
              >
                {shortMonth(item.label)}
              </span>

              {/* Rounded rectangle selector */}
              <div
                className="rounded-[4px]"
                style={{
                  width: `${scale * 24}px`,
                  height: `${scale * 6}px`,
                  backgroundColor: barColor,
                  transition: 'all 150ms ease-out',
                }}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
