import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { PipelineConfig } from "../types/index.js";

function loadConfig(): PipelineConfig {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const configPath = resolve(currentDir, "..", "..", "pipeline.config.json");
    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as PipelineConfig;
}

export default loadConfig;
