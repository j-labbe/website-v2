export interface DateSpineProps {
    months: { key: string; label: string }[];
    activeMonth: string | null;
}

export type SpineItem =
    | { type: "year"; year: string }
    | { type: "month"; key: string; label: string; monthIndex: number };