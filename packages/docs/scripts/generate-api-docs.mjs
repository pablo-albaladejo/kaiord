import { execSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(__dirname, "..");
const apiDir = join(docsRoot, "api");

const packages = [
  { name: "core", entryPoint: "packages/core/src/index.ts" },
  { name: "fit", entryPoint: "packages/fit/src/index.ts" },
  { name: "tcx", entryPoint: "packages/tcx/src/index.ts" },
  { name: "zwo", entryPoint: "packages/zwo/src/index.ts" },
  { name: "garmin", entryPoint: "packages/garmin/src/index.ts" },
  {
    name: "garmin-connect",
    entryPoint: "packages/garmin-connect/src/index.ts",
  },
  { name: "cli", entryPoint: "packages/cli/src/index.ts" },
  { name: "mcp", entryPoint: "packages/mcp/src/index.ts" },
];

const monorepoRoot = join(docsRoot, "..", "..");

mkdirSync(apiDir, { recursive: true });

console.log("Generating API reference docs with TypeDoc...");

for (const pkg of packages) {
  const entryPath = join(monorepoRoot, pkg.entryPoint);
  if (!existsSync(entryPath)) {
    // Create placeholder for packages without index.ts (e.g., CLI)
    const placeholderDir = join(apiDir, pkg.name);
    mkdirSync(placeholderDir, { recursive: true });
    writeFileSync(
      join(placeholderDir, "index.md"),
      [
        "---",
        `title: "@kaiord/${pkg.name} API"`,
        `description: "API reference for @kaiord/${pkg.name}"`,
        "---",
        "",
        `# @kaiord/${pkg.name}`,
        "",
        `See the [CLI Commands Reference](/cli/commands) for documentation.`,
        "",
      ].join("\n")
    );
    console.warn(`  Placeholder: api/${pkg.name}/ (no index.ts entry point)`);
    continue;
  }

  const outDir = join(apiDir, pkg.name);
  mkdirSync(outDir, { recursive: true });

  const tsconfig = join(monorepoRoot, `packages/${pkg.name}/tsconfig.json`);
  try {
    execSync(
      [
        join(docsRoot, "node_modules/.bin/typedoc"),
        `--entryPoints ${entryPath}`,
        "--plugin typedoc-plugin-markdown",
        `--out ${outDir}`,
        existsSync(tsconfig) ? `--tsconfig ${tsconfig}` : "",
        "--readme none",
        "--hideGenerator",
        "--excludePrivate",
        "--excludeInternal",
      ]
        .filter(Boolean)
        .join(" "),
      {
        cwd: monorepoRoot,
        stdio: "pipe",
        timeout: 60_000,
      }
    );
    console.log(`  Generated: api/${pkg.name}/`);
  } catch (error) {
    // Create placeholder if TypeDoc fails
    writeFileSync(
      join(outDir, "index.md"),
      [
        "---",
        `title: "@kaiord/${pkg.name} API"`,
        `description: "API reference for @kaiord/${pkg.name}"`,
        "---",
        "",
        `# @kaiord/${pkg.name} API`,
        "",
        `API reference is being generated. Install and explore:`,
        "",
        "```bash",
        `pnpm add @kaiord/${pkg.name}`,
        "```",
        "",
      ].join("\n")
    );
    console.warn(
      `  Placeholder: api/${pkg.name}/ (TypeDoc needs tsconfig fix)`
    );
  }
}

// Create api/index.md if it does not exist (generated files are gitignored)
const apiIndex = join(apiDir, "index.md");
if (!existsSync(apiIndex)) {
  writeFileSync(
    apiIndex,
    [
      "---",
      "title: API Reference",
      "description: Auto-generated TypeScript API documentation for all Kaiord packages.",
      "---",
      "",
      "# API Reference",
      "",
      "Auto-generated from TSDoc comments using TypeDoc.",
      "",
      "| Package | Description |",
      "| --- | --- |",
      "| [@kaiord/core](./core/README.md) | Domain types, schemas, ports, and use cases |",
      "| [@kaiord/fit](./fit/README.md) | FIT format adapter (Garmin FIT SDK) |",
      "| [@kaiord/tcx](./tcx/README.md) | TCX format adapter |",
      "| [@kaiord/zwo](./zwo/README.md) | ZWO format adapter |",
      "| [@kaiord/garmin](./garmin/README.md) | Garmin Connect (GCN) format adapter |",
      "| [@kaiord/garmin-connect](./garmin-connect/README.md) | Garmin Connect API client |",
      "| [@kaiord/cli](./cli/index.md) | Command-line interface |",
      "| [@kaiord/mcp](./mcp/README.md) | Model Context Protocol server |",
      "",
    ].join("\n")
  );
  console.log("  Generated: api/index.md");
}

console.log("API reference generation complete.");
