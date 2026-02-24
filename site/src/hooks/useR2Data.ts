import { useState, useEffect } from "react";
import type { GraphData, ProjectsFile, PipelineMeta } from "@jacklabbe/shared";
import fetchWithTimeout from "../utils/fetchWithTimeout";

export interface R2Data {
    graph: GraphData | null;
    projects: ProjectsFile | null;
    meta: PipelineMeta | null;
}

export type R2State =
    | { status: "loading" }
    | { status: "loaded"; data: R2Data }
    | { status: "error"; error: string };

interface CachedData {
    timestamp: number;
    data: R2Data;
}

const R2_BASE = "https://data.jacklabbe.com";
const TIMEOUT_MS = 5_000;
const CACHE_KEY = "jlabbe-data-cache";
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const resources = ["graph.json", "projects.json", "meta.json"];

function getCachedData(): R2Data | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached: CachedData = JSON.parse(raw);
        if (Date.now() - cached.timestamp > CACHE_MAX_AGE_MS) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
        return cached.data;
    } catch {
        return null;
    }
}

function setCachedData(data: R2Data): void {
    try {
        const cached: CachedData = { timestamp: Date.now(), data };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
        // sessionStorage full or unavailable - silently ignore
    }
}

export function useR2Data(): R2State {
    const [state, setState] = useState<R2State>(() => {
        const cached = getCachedData();
        if (cached) return { status: "loaded", data: cached };
        return { status: "loading" };
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {

                // goal: try to reduce repeated code
                // i'm not super happy with how this turned out and the repetition is small so i might refactor this later
                // it feels like Promise.all is a bit awkward. if you are reading this and have suggestions for improvement, please let me know or submit a PR!
                const [graph, projects, meta] = (await Promise.all(
                    resources.map((resource) =>
                        fetchWithTimeout(`${R2_BASE}/${resource}`, TIMEOUT_MS).then((response) =>
                            response.json()
                        )
                    )
                )) as [GraphData, ProjectsFile, PipelineMeta];

                const data: R2Data = { graph, projects, meta };
                setCachedData(data);

                if (!cancelled) {
                    setState({ status: "loaded", data });
                }
            } catch (err) {
                if (!cancelled) {
                    let message = "An unknown error occurred";
                    if (err instanceof DOMException && err.name === "AbortError") {
                        message = "Request timed out";
                    } else if (err instanceof Error) {
                        message = err.message;
                    }
                    setState({ status: "error", error: message });
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
