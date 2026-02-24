import type { ProjectsFile } from "@jacklabbe/shared";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { groupByMonth } from "../../utils/dateUtils";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import { DateSpine } from "./DateSpine";
import { TimelineCard } from "./TimelineCard";

interface TimelineProps {
    projects: ProjectsFile;
}

export function Timeline({ projects }: TimelineProps) {
    const months = groupByMonth(projects.projects);
    const sectionIds = months.map((m) => "month-" + m.key);
    const activeId = useScrollSpy(sectionIds);
    const activeMonth = activeId?.replace(/^month-/, "") ?? null;

    return (
        <section aria-label="Project timeline">
            {/* Two-column layout: cards flex-1, spine fixed-width shrink-0 */}
            <div className="flex gap-2 overflow-visible">
                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-10">
                    {months.map((month) => (
                        <div key={month.key} id={"month-" + month.key}>
                            <h3 className="font-bold font-mono text-text-bright text-sm mb-3 pb-2">{month.label}</h3>
                            <div className="space-y-3">
                                {month.projects.map((project) => (
                                    <ScrollReveal
                                        key={`${month.key}-${project.id}`}
                                        baseOpacity={0}
                                        enableBlur={true}
                                        blurStrength={2}
                                        baseRotation={0}
                                        baseTranslateY={30}
                                    >
                                        <TimelineCard project={project} monthKey={month.key} />
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Date spine — fixed width column, hover content overflows left */}
                <div className="shrink-0 w-20 overflow-visible">
                    <DateSpine
                        months={months.map((m) => ({
                            key: m.key,
                            label: m.label,
                        }))}
                        activeMonth={activeMonth}
                    />
                </div>
            </div>

            <div className="my-10 py-5"></div>
        </section>
    );
}
