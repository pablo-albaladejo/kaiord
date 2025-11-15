import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/tests/**/*.ts",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Enforce maximum file length of 100 lines (excluding test files)
      "max-lines": [
        "error",
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Enforce maximum function length
      "max-lines-per-function": [
        "warn",
        {
          max: 40,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Prohibit 'any' type
      "@typescript-eslint/no-explicit-any": "error",
      // Prefer type over interface
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      // Enforce consistent imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
    },
  },
  {
    // Test files: basic linting without type checking
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/tests/**/*.ts",
    ],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Disable max-lines for test files
      "max-lines": "off",
      "max-lines-per-function": "off",
      // Basic TypeScript rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
  {
    // Public API entry points: disable max-lines
    files: ["**/src/index.ts", "**/index.ts"],
    rules: {
      "max-lines": "off",
    },
  },
  {
    // Ignore patterns
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  }
);
