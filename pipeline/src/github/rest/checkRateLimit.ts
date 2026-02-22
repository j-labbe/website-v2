import { Octokit } from "@octokit/rest";
import type { RateLimitInfo } from "../../types";
import { log } from "../../utils";

export default async function checkRateLimit(octokit: Octokit): Promise<RateLimitInfo> {
    const { data } = await octokit.rateLimit.get();

    const core = data.resources.core;
    const graphql = data.resources.graphql;

    log("rate-limit", {
        core: { remaining: core.remaining, limit: core.limit },
        graphql: graphql
            ? { remaining: graphql.remaining, limit: graphql.limit }
            : { remaining: "unknown", limit: "unknown" },
    });

    if (core.remaining < 100) {
        log("rate-limit-warning", {
            message: "REST rate limit critically low",
            remaining: core.remaining,
            resetsAt: new Date(core.reset * 1000).toISOString(),
        });
    }

    return {
        remaining: core.remaining,
        resetAt: new Date(core.reset * 1000),
    };
}