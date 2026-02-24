import type { GraphData, ProjectsFile, PipelineMeta } from "@jacklabbe/shared";
import { useState, useEffect, useCallback } from "react";
import fetchWithTimeout from "../utils/fetchWithTimeout";

export interface R2Data {
    graph: GraphData | null;
    projects: ProjectsFile | null;
    meta: PipelineMeta | null;
}

export type R2State =
    | { status: "loading" }
    | { status: "loaded"; data: R2Data; partial: boolean }
    | { status: "error"; error: string };

interface CachedData {
    timestamp: number;
    data: R2Data;
}

const R2_BASE = "https://data.jacklabbe.com";
const TIMEOUT_MS = 12_000;
// const TIMEOUT_MS = 1;
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

export function useR2Data(): R2State & { retry: () => void } {
    const [state, setState] = useState<R2State>(() => {
        const cached = getCachedData();
        if (cached) return { status: "loaded", data: cached, partial: false };
        return { status: "loading" };
    });

    const load = useCallback(async (signal: { cancelled: boolean }) => {
        setState({ status: "loading" });

        const results = await Promise.allSettled(
            resources.map((resource) =>
                fetchWithTimeout(`${R2_BASE}/${resource}`, TIMEOUT_MS).then((response) => response.json()),
            ),
        );

        if (signal.cancelled) return;

        const graph = results[0].status === "fulfilled" ? (results[0].value as GraphData) : null;
        const projects = results[1].status === "fulfilled" ? (results[1].value as ProjectsFile) : null;
        const meta = results[2].status === "fulfilled" ? (results[2].value as PipelineMeta) : null;

        const allFailed = !graph && !projects && !meta;

        if (allFailed) {
            const firstError = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
            const reason = firstError?.reason;
            let message = "An unknown error occurred";
            if (reason instanceof DOMException && reason.name === "AbortError") {
                message = "Request timed out";
            } else if (reason instanceof Error) {
                message = reason.message;
            }
            setState({ status: "error", error: message });
            return;
        }

        const data: R2Data = { graph, projects, meta };
        const partial = !graph || !projects || !meta;
        setCachedData(data);
        setState({ status: "loaded", data, partial });
    }, []);

    const signalRef = { current: { cancelled: false } };

    useEffect(() => {
        const signal = { cancelled: false };
        signalRef.current = signal;

        if (state.status !== "loaded") {
            load(signal);
        }

        return () => {
            signal.cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const retry = useCallback(() => {
        signalRef.current.cancelled = true;
        const signal = { cancelled: false };
        signalRef.current = signal;
        load(signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    return { ...state, retry };
}
