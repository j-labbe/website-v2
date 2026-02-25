/**
 * Post-build SSG script.
 *
 * 1. Runs a Vite SSR build to produce a Node-compatible bundle of entry-server.tsx
 * 2. Imports the bundle's render() function
 * 3. Reads the client-built dist/index.html
 * 4. Replaces <!--ssr-outlet--> with the pre-rendered HTML
 * 5. Writes the final index.html back to dist/
 * 6. Cleans up the SSR bundle directory (not deployed)
 */

import { readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(siteRoot, "dist");
const ssrOutDir = path.resolve(distDir, ".ssr");

async function prerender() {
    console.log("[prerender] Building SSR bundle...");

    await build({
        root: siteRoot,
        build: {
            ssr: "src/entry-server.tsx",
            outDir: ssrOutDir,
            rollupOptions: {
                output: { format: "esm" },
            },
        },
    });

    console.log("[prerender] SSR bundle built. Rendering HTML...");

    const { render } = await import(path.resolve(ssrOutDir, "entry-server.js"));
    const appHtml = render();

    const indexHtmlPath = path.resolve(distDir, "index.html");
    const template = await readFile(indexHtmlPath, "utf-8");

    if (!template.includes("<!--ssr-outlet-->")) {
        throw new Error(
            "[prerender] Could not find <!--ssr-outlet--> in dist/index.html. " +
                "Make sure site/index.html contains <!--ssr-outlet--> inside #root.",
        );
    }

    const html = template.replace("<!--ssr-outlet-->", appHtml);
    await writeFile(indexHtmlPath, html);

    console.log("[prerender] Wrote pre-rendered index.html");

    // Clean up the SSR bundle -- it's not deployed
    await rm(ssrOutDir, { recursive: true, force: true });
    console.log("[prerender] Cleaned up SSR bundle directory");
    console.log("[prerender] Done!");
}

prerender().catch((err) => {
    console.error("[prerender] Fatal error:", err);
    process.exit(1);
});
