import js from "@eslint/js";
import importX from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    // ── Global ignores ──────────────────────────────────────────────────
    {
        ignores: ["**/dist/**", "**/node_modules/**", "**/*.js", "**/*.mjs", "**/*.d.ts", "site/src/generated/**"],
    },

    // ── Base rules for all TS files ─────────────────────────────────────
    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: {
            "import-x": importX,
        },
        rules: {
            // ── Import hygiene ──────────────────────────────────────────
            "import-x/order": [
                "warn",
                {
                    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                    alphabetize: { order: "asc", caseInsensitive: true },
                    "newlines-between": "never",
                },
            ],
            "import-x/no-duplicates": "warn",
            "import-x/no-useless-path-segments": "warn",

            // ── TypeScript tweaks ───────────────────────────────────────
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],

            // ── General ─────────────────────────────────────────────────
            "no-console": ["warn", { allow: ["warn", "error"] }],
        },
    },

    // ── React-specific (site/) ──────────────────────────────────────────
    {
        files: ["site/src/**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/immutability": "off",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        },
    },

    // ── Node-side (pipeline/) ───────────────────────────────────────────
    {
        files: ["pipeline/src/**/*.ts"],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            "no-console": "off", // pipeline uses console logging
        },
    },
);
