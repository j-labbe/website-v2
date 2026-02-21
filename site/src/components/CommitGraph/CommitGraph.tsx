import { useRef, useState, useCallback } from 'react';
import type { GraphData } from '@jacklabbe/shared';
import { CommitGraphTooltip } from './CommitGraphTooltip';
import {
  CELL_SIZE,
  CELL_GAP,
  CELL_RADIUS,
  LABEL_OFFSET,
  MONTH_LABEL_HEIGHT,
  LEVEL_COLORS,
  dayToCellPosition,
  getColumnDelay,
  formatTooltipText,
  getMonthLabels,
} from './commitGraphUtils';
import type { CellPosition } from './commitGraphUtils';

interface CommitGraphProps {
  data: GraphData;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const;
const LEGEND_CELL_SIZE = 10;
const LEGEND_GAP = 3;

export function CommitGraph({ data }: CommitGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  });

  // Map days to cell positions
  const cells = data.days.map((d) => dayToCellPosition(d, data.rangeStart));
  const totalWeeks = cells.length > 0
    ? Math.max(...cells.map((c) => c.weekIndex)) + 1
    : 0;

  // Month labels
  const monthLabels = getMonthLabels(cells, data.rangeStart);

  // SVG dimensions
  const svgWidth = LABEL_OFFSET + totalWeeks * (CELL_SIZE + CELL_GAP) + CELL_GAP;
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * (CELL_SIZE + CELL_GAP) + CELL_GAP + 30; // +30 for legend

  // Tooltip handlers using container DOM coords
  const handleMouseEnter = useCallback(
    (cell: CellPosition, event: React.MouseEvent<SVGRectElement>) => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;

      const containerRect = container.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      // Cell position in SVG coordinate space
      const cellSvgX = LABEL_OFFSET + cell.weekIndex * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
      const cellSvgY = MONTH_LABEL_HEIGHT + cell.dayIndex * (CELL_SIZE + CELL_GAP);

      // Scale SVG coords to DOM coords
      const scaleX = svgRect.width / svgWidth;
      const scaleY = svgRect.height / svgHeight;

      const domX = svgRect.left - containerRect.left + cellSvgX * scaleX;
      const domY = svgRect.top - containerRect.top + cellSvgY * scaleY;

      setTooltip({
        visible: true,
        x: domX,
        y: domY,
        text: formatTooltipText(cell.count, cell.date),
      });
    },
    [svgWidth, svgHeight],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleClick = useCallback((cell: CellPosition) => {
    const monthKey = cell.date.slice(0, 7); // "2026-02-15" → "2026-02"
    document.getElementById('month-' + monthKey)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Legend dimensions
  const legendWidth = 5 * (LEGEND_CELL_SIZE + LEGEND_GAP) + 60; // cells + "Less" + "More" text
  const legendX = svgWidth - legendWidth - 5;
  const legendY = svgHeight - 22;

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label="Commit activity over the past year"
        className="block"
        style={{ minWidth: svgWidth }}
      >
        {/* Month labels along top */}
        {monthLabels.map((m) => (
          <text
            key={`month-${m.label}-${m.weekIndex}`}
            x={LABEL_OFFSET + m.weekIndex * (CELL_SIZE + CELL_GAP)}
            y={MONTH_LABEL_HEIGHT - 6}
            fill="var(--color-text-dim)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {m.label}
          </text>
        ))}

        {/* Day-of-week labels on left */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <text
              key={`day-${i}`}
              x={LABEL_OFFSET - 6}
              y={MONTH_LABEL_HEIGHT + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
              fill="var(--color-text-dim)"
              fontSize={10}
              fontFamily="var(--font-mono)"
              textAnchor="end"
              dominantBaseline="central"
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Heatmap cells */}
        {cells.map((cell) => (
          <rect
            key={cell.date}
            x={LABEL_OFFSET + cell.weekIndex * (CELL_SIZE + CELL_GAP)}
            y={MONTH_LABEL_HEIGHT + cell.dayIndex * (CELL_SIZE + CELL_GAP)}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={CELL_RADIUS}
            fill={LEVEL_COLORS[cell.level]}
            className="commit-cell"
            style={{
              animationDelay: getColumnDelay(cell.weekIndex, totalWeeks),
            }}
            onMouseEnter={(e) => handleMouseEnter(cell, e)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(cell)}
          />
        ))}

        {/* Less-More legend */}
        <text
          x={legendX}
          y={legendY + LEGEND_CELL_SIZE / 2}
          fill="var(--color-text-dim)"
          fontSize={10}
          fontFamily="var(--font-mono)"
          dominantBaseline="central"
        >
          Less
        </text>
        {LEVEL_COLORS.map((color, i) => (
          <rect
            key={`legend-${i}`}
            x={legendX + 30 + i * (LEGEND_CELL_SIZE + LEGEND_GAP)}
            y={legendY}
            width={LEGEND_CELL_SIZE}
            height={LEGEND_CELL_SIZE}
            rx={2}
            fill={color}
          />
        ))}
        <text
          x={legendX + 30 + 5 * (LEGEND_CELL_SIZE + LEGEND_GAP) + 4}
          y={legendY + LEGEND_CELL_SIZE / 2}
          fill="var(--color-text-dim)"
          fontSize={10}
          fontFamily="var(--font-mono)"
          dominantBaseline="central"
        >
          More
        </text>
      </svg>

      <CommitGraphTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        text={tooltip.text}
      />
    </div>
  );
}
