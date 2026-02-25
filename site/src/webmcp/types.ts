import type { GraphData, ProjectsFile } from "@jacklabbe/shared";

type JsonSchema = Record<string, unknown>;

interface ToolResult {
    content: Array<{ type: "text"; text: string }>;
}

interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: JsonSchema;
    execute: (input: Record<string, unknown>, agent?: unknown) => ToolResult | Promise<ToolResult>;
}

interface ModelContextLike {
    provideContext?: (context: { tools: ToolDefinition[] }) => void;
    registerTool?: (tool: ToolDefinition) => void;
    unregisterTool?: (name: string) => void;
}

declare global {
    interface Navigator {
        modelContext?: ModelContextLike;
    }
}

interface WebMCPSnapshot {
    about: string | undefined;
    graph: GraphData | null;
    projects: ProjectsFile | null;
}

export type { GraphData, ProjectsFile, WebMCPSnapshot, ToolDefinition, ToolResult };