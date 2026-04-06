import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const adapterPackages = ["fit", "tcx", "zwo", "garmin", "garmin-connect"];

// garmin-connect legitimately depends on garmin (GCN format)
const adapterAllowedDeps = {
  "garmin-connect": ["garmin"],
};

function adapterBoundaryRules() {
  return adapterPackages.map((pkg) => ({
    files: [`packages/${pkg}/src/**/*.ts`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: adapterPackages
            .filter((other) => other !== pkg)
            .filter((other) => !(adapterAllowedDeps[pkg] ?? []).includes(other))
            .map((other) => ({
              name: `@kaiord/${other}`,
              message:
                "Adapter packages must not depend on other adapters. Depend on @kaiord/core only.",
            })),
        },
      ],
    },
  }));
}

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
      "**/storybook-static/**",
      "**/test-setup.ts",
      "**/test-utils/**",
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
      import: importPlugin,
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
        "error",
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
      // Enforce import ordering
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // npm packages
            "internal", // Internal modules
            ["parent", "sibling"], // Relative imports
            "index", // index imports
            "type", // Type imports
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    // Backend adapter packages: same rules as core
    files: [
      "packages/fit/**/*.ts",
      "packages/tcx/**/*.ts",
      "packages/zwo/**/*.ts",
      "packages/garmin/**/*.ts",
      "packages/garmin-connect/**/*.ts",
      "packages/cli/**/*.ts",
      "packages/mcp/**/*.ts",
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
      import: importPlugin,
    },
    rules: {
      "max-lines": [
        "error",
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-lines-per-function": [
        "error",
        {
          max: 40,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      complexity: ["error", 10],
      "max-depth": ["error", 4],
      "max-params": ["error", 4],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "type",
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
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
      import: importPlugin,
    },
    rules: {
      // Disable max-lines for test files
      "max-lines": "off",
      "max-lines-per-function": "off",
      // Basic TypeScript rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      // Enforce import ordering
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "type",
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      // Prevent magic numbers (large timeouts should be constants)
      "no-magic-numbers": [
        "warn",
        {
          ignore: [0, 1, 2, -1, 100, 200, 400, 404, 500], // Common numbers
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],
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
      import: importPlugin,
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
        "error",
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
      // Enforce import ordering
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "type",
          ],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      // Prevent static imports of heavy adapter packages (use dynamic import())
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@kaiord/fit",
              message: "Use dynamic import() for code splitting.",
              allowTypeImports: true,
            },
            {
              name: "@kaiord/tcx",
              message: "Use dynamic import() for code splitting.",
              allowTypeImports: true,
            },
            {
              name: "@kaiord/zwo",
              message: "Use dynamic import() for code splitting.",
              allowTypeImports: true,
            },
            {
              name: "@kaiord/garmin",
              message: "Use dynamic import() for code splitting.",
              allowTypeImports: true,
            },
          ],
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
  },
  {
    // Hexagonal architecture boundaries for core package
    files: ["packages/core/src/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        {
          type: "domain",
          pattern: "packages/core/src/domain/**",
        },
        {
          type: "application",
          pattern: "packages/core/src/application/**",
        },
        {
          type: "ports",
          pattern: "packages/core/src/ports/**",
        },
        {
          type: "adapters",
          pattern: "packages/core/src/adapters/**",
        },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              // domain must not import from application, ports, or adapters
              from: "domain",
              disallow: ["application", "ports", "adapters"],
              message:
                "Domain layer must not depend on {{target}}. Domain is pure and self-contained.",
            },
            {
              // application must not import from adapters
              from: "application",
              disallow: ["adapters"],
              message:
                "Application layer must not depend on adapters. Use ports instead.",
            },
            {
              // ports must not import from application or adapters
              from: "ports",
              disallow: ["application", "adapters"],
              message:
                "Ports must not depend on {{target}}. Ports define interfaces only.",
            },
          ],
        },
      ],
    },
  },
  ...adapterBoundaryRules()
);
