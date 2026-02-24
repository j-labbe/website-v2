import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
    },
    resolve: {
        alias: {
            "@jacklabbe/shared": resolve(__dirname, "../shared/src/index.ts"),
        },
    },
});
