import type { ContributionDay } from "@jacklabbe/shared";

// --- Constants ---
export const CELL_SIZE = 13;
export const CELL_GAP = 3;
export const CELL_RADIUS = 2;
export const LABEL_OFFSET = 30; // Space for day-of-week labels on left
export const MONTH_LABEL_HEIGHT = 20; // Space for month labels on top

// --- Color Scale ---
// 4-level blue scale matching site dark theme
// Level 0 = empty (faint fill to show grid structure)
// Levels 1-4 = increasingly vivid blue
export const LEVEL_COLORS = [
    "#0a1628", // level 0: empty -- near-background
    "#0e3460", // level 1: low -- dark navy-blue
    "#1a6dbd", // level 2: medium -- mid blue
    "#3b8eea", // level 3: high -- bright blue
    "#4F7DF5", // level 4: very high -- matches --color-accent
] as const;

// --- Types ---
export interface CellPosition {
    weekIndex: number;
    dayIndex: number; // 0=Sun, 6=Sat
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface MonthLabel {
    label: string;
    weekIndex: number;
}

// --- Utility Functions ---

/**
 * Maps a ContributionDay to grid coordinates.
 * CRITICAL: Uses UTC date methods consistently to avoid timezone shifting.
 */
export function dayToCellPosition(
    day: ContributionDay,
    rangeStart: string,
): CellPosition {
    const start = new Date(rangeStart + "T00:00:00Z");
    const current = new Date(day.date + "T00:00:00Z");

    const daysSinceStart = Math.round(
        (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const startDayOfWeek = start.getUTCDay(); // 0=Sun
    const totalOffset = daysSinceStart + startDayOfWeek;

    return {
        weekIndex: Math.floor(totalOffset / 7),
        dayIndex: totalOffset % 7,
        date: day.date,
        count: day.count,
        level: day.level,
    };
}

/**
 * Returns animation-delay for left-to-right wave effect.
 * Spreads over ~1.5s total across all columns.
 */
export function getColumnDelay(weekIndex: number, totalWeeks: number): string {
    const delayMs = (weekIndex / totalWeeks) * 1500;
    return `${delayMs}ms`;
}

/**
 * Formats tooltip text: "12 commits on Jan 15, 2026"
 * Uses Intl.DateTimeFormat with UTC timezone to avoid date shift.
 */
export function formatTooltipText(count: number, date: string): string {
    const d = new Date(date + "T00:00:00Z");
    const formatted = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(d);
    return `${count} ${count === 1 ? "commit" : "commits"} on ${formatted}`;
}

/**
 * Computes month label positions by finding the first weekIndex where each month starts.
 */
export function getMonthLabels(
    cells: CellPosition[],
    _rangeStart: string,
): MonthLabel[] {
    const months = new Map<string, number>();
    const shortMonths = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    for (const cell of cells) {
        const d = new Date(cell.date + "T00:00:00Z");
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        if (!months.has(key)) {
            months.set(key, cell.weekIndex);
        }
    }

    const labels: MonthLabel[] = [];
    for (const [key, weekIndex] of months) {
        const monthIndex = parseInt(key.split("-")[1], 10);
        labels.push({
            label: shortMonths[monthIndex],
            weekIndex,
        });
    }

    return labels;
}
