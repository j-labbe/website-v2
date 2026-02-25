import buildTools from "./buildTools";
import type { WebMCPSnapshot } from "./types";

export function installWebMCP(getSnapshot: () => WebMCPSnapshot): () => void {
    const modelContext = navigator.modelContext;
    if (!modelContext) return () => {};

    const tools = buildTools(getSnapshot);

    if (typeof modelContext.provideContext === "function") {
        modelContext.provideContext({ tools });
        return () => {
            modelContext.provideContext?.({ tools: [] });
        };
    }

    if (typeof modelContext.registerTool === "function") {
        for (const tool of tools) {
            modelContext.registerTool(tool);
        }

        return () => {
            if (typeof modelContext.unregisterTool !== "function") return;
            for (const tool of tools) {
                modelContext.unregisterTool(tool.name);
            }
        };
    }

    return () => {};
}

export type { WebMCPSnapshot } from "./types";