import yearFromKey from "./fromYearKey";
import type { SpineItem } from "../types";

function buildSpineItems(
    months: { key: string; label: string }[],
): SpineItem[] {
    const items: SpineItem[] = [];
    let lastYear = "";
    let monthIndex = 0;

    for (const { key, label } of months) {
        const year = yearFromKey(key);
        if (year !== lastYear) {
            items.push({ type: "year", year });
            lastYear = year;
        }
        items.push({ type: "month", key, label, monthIndex });
        monthIndex++;
    }

    return items;
}

export default buildSpineItems;