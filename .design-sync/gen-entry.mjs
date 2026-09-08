// Generates the design-system bundle entry for design-sync.
//
// workout-spa-editor is a private SPA, not a publishable library: it has no
// `main`/`module`/`exports` and its `dist/` is a vite app build (index.html +
// hashed chunks), which exports nothing. The design-sync converter needs a
// module whose named exports become `window.<globalName>.*`, so we synthesize
// one from the component tree.
//
// Emitted with EXPLICIT named re-exports rather than `export * from`: the tree
// has ~85 component modules and star re-exports would make same-named symbols
// (Props aliases, helper consts) ambiguous, which ESM resolves to undefined at
// runtime rather than failing loudly at build time.
//
// Run from the repo root: node .design-sync/gen-entry.mjs

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PKG = "packages/workout-spa-editor";
const COMPONENTS = join(PKG, "src/components");
// pages/ are app routes wired to the router and stores, not reusable design
// system parts - they are deliberately outside the synced surface.
const LAYERS = [
  "atoms",
  "molecules",
  "organisms",
  "templates",
  "charts",
  "providers",
];
const OUT = join(PKG, "design-system.ts");

/** Names exported as values by a module, in source order. */
function valueExports(file) {
  const src = readFileSync(file, "utf8");
  const names = [];
  const re = /^export\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_]*)/gm;
  for (const m of src.matchAll(re)) names.push(m[1]);
  // `export { A, B }` re-export / grouped export lists
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const raw of m[1].split(",")) {
      const name = raw
        .split(/\s+as\s+/)
        .pop()
        .trim();
      if (/^[A-Z][A-Za-z0-9_]*$/.test(name) && !raw.includes("type "))
        names.push(name);
    }
  }
  return [...new Set(names)];
}

const lines = [];
const seen = new Map();
let count = 0;

for (const layer of LAYERS) {
  const dir = join(COMPONENTS, layer);
  if (!existsSync(dir)) continue;
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const layerLines = [];
  for (const name of entries) {
    // Convention: <Name>/<Name>.tsx is the component module. Grouping dirs
    // (CoachingCard/, Connections/, SettingsPanel/ ...) hold many components
    // and no same-named file; every module inside them is picked up instead.
    const canonical = join(dir, name, `${name}.tsx`);
    const files = existsSync(canonical)
      ? [canonical]
      : readdirSync(join(dir, name))
          .filter(
            (f) => /^[A-Z][A-Za-z0-9]*\.tsx$/.test(f) && !f.includes(".test.")
          )
          .sort()
          .map((f) => join(dir, name, f));

    for (const file of files) {
      const exports = valueExports(file).filter((n) => {
        if (seen.has(n)) return false;
        seen.set(n, file);
        return true;
      });
      if (!exports.length) continue;
      const spec = "./" + file.slice(PKG.length + 1).replace(/\.tsx$/, "");
      layerLines.push(`export { ${exports.join(", ")} } from "${spec}";`);
      count += exports.length;
    }
  }
  if (layerLines.length) lines.push(`// ${layer}`, ...layerLines, "");
}

// Context providers. Stories supply their own context via meta decorators that
// import these by relative path (e.g. ThemeToggle imports ThemeProvider), and
// the converter rewrites relative imports to `window.KaiordDesignSystem.*`. A
// provider missing from the bundle therefore resolves to `undefined` and the
// decorator collapses — the story then fails with the very "must be used within
// a Provider" error the decorator exists to prevent.
const CONTEXT_DIRS = ["src/contexts", "src/i18n"].map((d) => join(PKG, d));
const contextLines = [];
for (const file of CONTEXT_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".tsx") && !f.includes(".test."))
    .sort()
    .map((f) => join(dir, f))
)) {
  const exports = valueExports(file).filter((n) => {
    if (seen.has(n)) return false;
    seen.set(n, file);
    return true;
  });
  if (!exports.length) continue;
  const spec = "./" + file.slice(PKG.length + 1).replace(/\.tsx$/, "");
  contextLines.push(`export { ${exports.join(", ")} } from "${spec}";`);
  count += exports.length;
}
if (contextLines.length) lines.push("// contexts", ...contextLines, "");

// The one component `cfg.provider` names. It wraps the whole chain with the
// runtime values JSON cannot express (a persistence port, a router hook), so a
// card can mount anything the app can.
//
// The three that follow exist for the owned previews under
// `.design-sync/previews/`. The converter rewrites their relative imports to
// `window.KaiordDesignSystem.*`, so a symbol missing from this entry resolves
// to `undefined` and the preview throws — which reads, unhelpfully, as an empty
// card rather than as a missing export.
lines.push(
  "// provider chain for the card harness",
  'export { DesignSystemProviders } from "./design-system-providers";',
  'export { ToastProvider } from "./src/components/atoms/Toast/ToastProvider";',
  'export { useWorkoutStore } from "./src/store/workout-store";',
  'export { createInMemoryPersistence } from "./src/test-utils/in-memory-persistence";',
  // `valueExports` only picks PascalCase names, on the assumption that a
  // component is what matters. A hook a preview calls is camelCase and falls
  // through, then reads `undefined` at render: "useGarminBridge is not a
  // function".
  'export { useGarminBridge } from "./src/contexts/garmin-bridge-context";',
  ""
);
count += 5;

const header = `// GENERATED by .design-sync/gen-entry.mjs - do not edit by hand.
// Bundle entry for the claude.ai/design sync: every export here becomes a
// member of window.KaiordDesignSystem in the uploaded _ds_bundle.js.
`;
writeFileSync(OUT, header + "\n" + lines.join("\n"));
console.log(`wrote ${OUT}: ${count} exports from ${seen.size} symbols`);
