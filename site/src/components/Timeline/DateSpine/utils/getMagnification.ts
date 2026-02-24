export default function getMagnification(
    monthIndex: number,
    hoveredMonthIndex: number | null,
): { scale: number; brightness: number } {
    if (hoveredMonthIndex === null) return { scale: 1, brightness: 0 };
    const distance = Math.abs(monthIndex - hoveredMonthIndex);
    const falloff = Math.exp(-(distance * distance) / 3);
    return {
        scale: 1 + 0.5 * falloff,
        brightness: falloff,
    };
}
