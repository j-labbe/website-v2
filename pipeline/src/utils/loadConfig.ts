import { readFileSync } from "fs";
import { resolve } from "path";
import type { PipelineConfig } from "../types/index.js";

function loadConfig(): PipelineConfig {
    // Resolve from repo root (one level up from worker/)
    const configPath = resolve(process.cwd(), "..", "pipeline.config.json");
    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as PipelineConfig;
}

export default loadConfig;