import { ActivityCalendar } from "react-activity-calendar";
import type { Activity, ThemeInput } from "react-activity-calendar";
import { ContributionDay } from "@jacklabbe/shared";
import { cloneElement } from "react";

export const CommitGraph = ({ data }: { data: ContributionDay[] }) => {

    const LEVEL_COLORS = [
        "#0a1628",
        "#0e3460",
        "#1a6dbd",
        "#3b8eea",
        "#4F7DF5",
    ];

    const theme: ThemeInput = {
        light: LEVEL_COLORS,
        dark: LEVEL_COLORS
    }

    return (
        <div className="p-4 overflow-x-auto">
            <div className="w-fit min-w-[720px]">
                <ActivityCalendar
                    data={data as Activity[]}
                    theme={theme}
                    showTotalCount={false}
                    tooltips={{
                        activity: {
                            text: activity => `${activity.count} contributions on ${activity.date}`,
                            placement: "top",
                            offset: 5,
                            transitionStyles: {
                                duration: 100
                            },
                            withArrow: true
                        }
                    }}
                    renderBlock={(block, activity) => cloneElement(block, {
                        onClick: () => {
                            const monthKey = activity.date.slice(0, 7);
                            document.getElementById("month-" + monthKey)?.scrollIntoView({ behavior: "smooth" });
                        },
                        className: block.props.className + " cursor-pointer"
                    })}
                    style={{ cursor: "default" }}
                />
            </div>
        </div>
    );
}