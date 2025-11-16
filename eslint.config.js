import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Ignore patterns first
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/scripts/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.stories.ts",
      "**/*.stories.tsx",
      "**/tests/**/*.ts",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.playwright/**",
      "**/.storybook/**",
    ],
  },
  {
    // Core package: strict 40 lines per function
    files: ["packages/core/**/*.ts", "packages/core/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
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
    files: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**/*.ts"],
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
    // Frontend package: relaxed 60 lines per function for React components
    files: [
      "packages/workout-spa-editor/**/*.ts",
      "packages/workout-spa-editor/**/*.tsx",
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Enforce maximum file length of 100 lines (excluding test files)
      "max-lines": [
        "error",
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Enforce maximum function length (60 for frontend components)
      "max-lines-per-function": [
        "warn",
        {
          max: 60,
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
    // Frontend page components: allow more lines for orchestration
    files: ["packages/workout-spa-editor/**/pages/**/*.tsx"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 150,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    // Public API entry points: disable max-lines
    // These files only contain exports and have no logic
    files: ["**/src/index.ts", "**/index.ts"],
    rules: {
      "max-lines": "off",
    },
  }
);
