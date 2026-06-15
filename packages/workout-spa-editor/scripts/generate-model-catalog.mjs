/**
 * Generates `src/lib/generated/model-catalog.ts` from the installed `@ai-sdk/*`
 * model-id type unions. Run via `pnpm generate:model-catalog` after bumping the
 * SDK. The freshness guard test fails CI if the committed file drifts from this
 * output.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { extractCatalog, renderCatalogModule } from "./model-catalog-extract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "lib", "generated", "model-catalog.ts");

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, renderCatalogModule(extractCatalog()), "utf8");
console.log(`wrote ${out}`);
