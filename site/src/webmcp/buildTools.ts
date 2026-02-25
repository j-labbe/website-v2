import { MONTH_KEY_RE } from "./constants";
import { toTextResult, filterProjects, getSkillEvidence } from "./tools";
import type { ToolDefinition, WebMCPSnapshot } from "./types";

export default function buildTools(getSnapshot: () => WebMCPSnapshot): ToolDefinition[] {
    return [
        {
            name: "get_profile_summary",
            description: "Return summary profile info and dataset availability.",
            inputSchema: {
                type: "object",
                properties: {},
            },
            execute: () => {
                const snapshot = getSnapshot();

                return toTextResult({
                    role: "Software / AI Engineer",
                    about: snapshot.about || "",
                    hasGraph: !!snapshot.graph,
                    hasProjects: !!snapshot.projects,
                    totalContributions: snapshot.graph?.totalContributions ?? 0,
                    projectCount: snapshot.projects?.projects.length ?? 0,
                });
            },
        },
        {
            name: "get_activity_range",
            description: "Return contribution activity in a date range.",
            inputSchema: {
                type: "object",
                properties: {
                    startDate: {
                        type: "string",
                        description: "Inclusive start date in YYYY-MM-DD format",
                    },
                    endDate: {
                        type: "string",
                        description: "Inclusive end date in YYYY-MM-DD format",
                    },
                },
            },
            execute: (input) => {
                const snapshot = getSnapshot();
                const startDate = typeof input.startDate === "string" ? input.startDate : null;
                const endDate = typeof input.endDate === "string" ? input.endDate : null;
                const days = snapshot.graph?.days ?? [];

                const filteredDays = days.filter((day) => {
                    if (startDate && day.date < startDate) return false;
                    if (endDate && day.date > endDate) return false;
                    return true;
                });

                return toTextResult({
                    rangeStart: startDate ?? snapshot.graph?.rangeStart ?? null,
                    rangeEnd: endDate ?? snapshot.graph?.rangeEnd ?? null,
                    totalContributions: filteredDays.reduce((sum, day) => sum + day.count, 0),
                    days: filteredDays,
                });
            },
        },
        {
            name: "list_projects",
            description: "List projects filtered by month, language, visibility, and commit count.",
            inputSchema: {
                type: "object",
                properties: {
                    monthKey: {
                        type: "string",
                        description: "Month key in YYYY-MM format",
                    },
                    language: {
                        type: "string",
                        description: "Language name, e.g. TypeScript",
                    },
                    visibility: {
                        type: "string",
                        enum: ["public", "private"],
                    },
                    minCommits: {
                        type: "number",
                        minimum: 0,
                    },
                    maxResults: {
                        type: "number",
                        minimum: 1,
                        maximum: 50,
                    },
                },
            },
            execute: (input) => {
                const snapshot = getSnapshot();
                const projects = snapshot.projects?.projects ?? [];
                const filtered = filterProjects(projects, input);

                return toTextResult({
                    count: filtered.length,
                    projects: filtered,
                });
            },
        },
        {
            name: "jump_to_month",
            description: "Scroll the timeline to the requested month section.",
            inputSchema: {
                type: "object",
                properties: {
                    monthKey: {
                        type: "string",
                        description: "Month key in YYYY-MM format",
                    },
                },
                required: ["monthKey"],
            },
            execute: (input) => {
                const monthKey = typeof input.monthKey === "string" ? input.monthKey : "";

                if (!MONTH_KEY_RE.test(monthKey)) {
                    return toTextResult({ ok: false, error: "Invalid monthKey" });
                }

                const sectionId = `month-${monthKey}`;
                const section = document.getElementById(sectionId);
                if (!section) {
                    return toTextResult({ ok: false, error: "Month not found" });
                }

                section.scrollIntoView({ behavior: "smooth", block: "start" });
                return toTextResult({ ok: true, sectionId });
            },
        },
        {
            name: "explain_skill_evidence",
            description: "Return project evidence for a requested skill keyword.",
            inputSchema: {
                type: "object",
                properties: {
                    skill: {
                        type: "string",
                        description: "Skill keyword, e.g. AI, TypeScript, React",
                    },
                },
                required: ["skill"],
            },
            execute: (input) => {
                const snapshot = getSnapshot();
                const skill = typeof input.skill === "string" ? input.skill : "";

                return toTextResult({
                    skill,
                    matches: getSkillEvidence(snapshot.projects?.projects ?? [], skill),
                });
            },
        },
    ];
}

