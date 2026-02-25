import type { ToolResult } from "../types";

export default function toTextResult(data: unknown): ToolResult {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}