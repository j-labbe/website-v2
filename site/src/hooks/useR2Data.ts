import { useState, useEffect } from 'react';
import type { GraphData, ProjectsFile, PipelineMeta } from '@jacklabbe/shared';

export interface R2Data {
  graph: GraphData | null;
  projects: ProjectsFile | null;
  meta: PipelineMeta | null;
}

export type R2State =
  | { status: 'loading' }
  | { status: 'loaded'; data: R2Data }
  | { status: 'error'; error: string };

const R2_BASE = import.meta.env.VITE_R2_BASE_URL;
const TIMEOUT_MS = 5_000;
const CACHE_KEY = 'r2-data-cache';
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

interface CachedData {
  timestamp: number;
  data: R2Data;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

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
    // sessionStorage full or unavailable -- silently ignore
  }
}

export function useR2Data(): R2State {
  const [state, setState] = useState<R2State>(() => {
    const cached = getCachedData();
    if (cached) return { status: 'loaded', data: cached };
    return { status: 'loading' };
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [graphRes, projectsRes, metaRes] = await Promise.all([
          fetchWithTimeout(`${R2_BASE}/graph.json`, TIMEOUT_MS),
          fetchWithTimeout(`${R2_BASE}/projects.json`, TIMEOUT_MS),
          fetchWithTimeout(`${R2_BASE}/meta.json`, TIMEOUT_MS),
        ]);

        const [graph, projects, meta] = await Promise.all([
          graphRes.json() as Promise<GraphData>,
          projectsRes.json() as Promise<ProjectsFile>,
          metaRes.json() as Promise<PipelineMeta>,
        ]);

        const data: R2Data = { graph, projects, meta };
        setCachedData(data);

        if (!cancelled) {
          setState({ status: 'loaded', data });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof DOMException && err.name === 'AbortError'
              ? 'Request timed out'
              : err instanceof Error
                ? err.message
                : 'Failed to load data';
          setState({ status: 'error', error: message });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
