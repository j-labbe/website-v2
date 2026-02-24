#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import sharp from "sharp";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const HEADSHOT = resolve(ROOT, "public/headshot.webp");
const OUTPUT = resolve(ROOT, "src/generated/lqip.ts");

async function generate() {
    mkdirSync(dirname(OUTPUT), { recursive: true });

    if (!existsSync(HEADSHOT)) {
        console.warn("⚠ headshot.webp not found — writing fallback LQIP placeholder");
        writeFileSync(
            OUTPUT,
            `// Auto-generated fallback — place headshot.webp in public/ and run: pnpm generate:lqip\nexport const LQIP_DATA_URI = '';\n`,
        );
        return;
    }

    const buffer = await sharp(HEADSHOT).resize(20, 20, { fit: "cover" }).webp({ quality: 20 }).toBuffer();

    const base64 = buffer.toString("base64");
    const dataUri = `data:image/webp;base64,${base64}`;

    writeFileSync(
        OUTPUT,
        `// Auto-generated from headshot.webp — do not edit\n// Regenerate: pnpm generate:lqip\nexport const LQIP_DATA_URI = '${dataUri}';\n`,
    );

    console.log(`✓ LQIP generated (${buffer.length} bytes) → src/generated/lqip.ts`);
}

generate().catch((err) => {
    console.error("LQIP generation failed:", err);
    process.exit(1);
});
