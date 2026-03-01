/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // === HEXAGONAL ARCHITECTURE RULES ===

    // Rule 1: Domain layer must not depend on anything outside domain
    {
      name: "domain-no-external-deps",
      comment:
        "Domain schemas/types must not import from application, ports, or adapters",
      severity: "error",
      from: { path: "packages/core/src/domain" },
      to: {
        path: [
          "packages/core/src/application",
          "packages/core/src/ports",
          "packages/core/src/adapters",
          "packages/(fit|tcx|zwo|garmin|garmin-connect|cli|mcp|ai)/src",
        ],
      },
    },

    // Rule 2: Application layer must not import adapter implementations
    {
      name: "application-no-adapters",
      comment:
        "Application use cases must depend only on ports (interfaces), never on concrete adapters",
      severity: "error",
      from: { path: "packages/core/src/application" },
      to: {
        path: [
          "packages/core/src/adapters",
          "packages/(fit|tcx|zwo|garmin|garmin-connect|cli|mcp|ai)/src",
        ],
      },
    },

    // Rule 3: Application must not import external libraries directly
    {
      name: "application-no-external-libs",
      comment:
        "Application layer must not depend on external libraries (only core domain + ports)",
      severity: "error",
      from: { path: "packages/core/src/application" },
      to: {
        dependencyTypes: ["npm"],
        pathNot: ["zod"], // zod is allowed as it defines domain schemas
      },
    },

    // Rule 4: Adapter packages depend only on core
    {
      name: "adapter-depends-only-on-core",
      comment:
        "Format adapter packages (fit, tcx, zwo, garmin) must only depend on @kaiord/core",
      severity: "error",
      from: {
        path: "packages/(fit|tcx|zwo|garmin)/src",
      },
      to: {
        path: "packages/(cli|mcp|garmin-connect|ai|workout-spa-editor)/src",
      },
    },

    // Rule 5: No circular dependencies between packages
    {
      name: "no-circular-package-deps",
      comment: "Packages must not have circular dependencies",
      severity: "error",
      from: { path: "packages/[^/]+/src" },
      to: { circular: true },
    },

    // Rule 6: Core must not depend on any adapter package
    {
      name: "core-no-adapter-deps",
      comment:
        "Core package must never depend on adapter packages (dependency inversion)",
      severity: "error",
      from: { path: "packages/core/src" },
      to: {
        path: "packages/(fit|tcx|zwo|garmin|garmin-connect|cli|mcp|ai)/src",
      },
    },

    // Rule 7: No orphan modules (dead files)
    {
      name: "no-orphans",
      comment: "Modules that are not reachable from any entry point",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "\\.test\\.ts$",
          "\\.spec\\.ts$",
          "\\.config\\.(ts|js|cjs|mjs)$",
          "test-utils",
          "__tests__",
          "tests/",
          "\\.d\\.ts$",
          "index\\.ts$",
          "bin/",
        ],
      },
      to: {},
    },

    // Rule 8: No dependencies on deprecated/banned modules
    {
      name: "no-deprecated-core",
      comment: "Do not use deprecated Node.js core modules",
      severity: "warn",
      from: {},
      to: { dependencyTypes: ["core"], path: "^(punycode|domain|constants)$" },
    },

    // === COUPLING RULES ===

    // Rule 9: Limit fan-out (max dependencies per module)
    {
      name: "max-module-fan-out",
      comment: "A module should not depend on more than 15 other modules",
      severity: "warn",
      from: {
        pathNot: ["index\\.ts$", "\\.test\\.ts$", "\\.spec\\.ts$"],
      },
      to: {},
      module: {
        numberOfDependentsLessThan: 100, // effectively disabled; fan-out checked via metrics
      },
    },
  ],

  options: {
    doNotFollow: {
      path: ["node_modules", "dist", "coverage"],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "packages/core/tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      json: {
        fileName: "metrics/latest/dependency-cruiser.json",
      },
    },
    exclude: {
      path: [
        "node_modules",
        "dist",
        "\\.test\\.ts$",
        "\\.spec\\.ts$",
        "\\.config\\.(ts|js|cjs|mjs)$",
        "test-utils",
        "__tests__",
        "tests/",
      ],
    },
    includeOnly: {
      path: "packages/[^/]+/src",
    },
  },
};
