// Copies the canonical brand font into the docs public dir before the build.
//
// `head-config.mjs` preloads `/docs/fonts/inter-var-latin.woff2` and
// `theme/custom.css` points its `@font-face` there; VitePress serves
// `public/` at the docs base, so this copy is what makes that URL exist.
// The source of truth is `styles/fonts/` (styles/AGENTS.md), never the
// landing's public copy. The target is gitignored: a committed duplicate
// would drift. Guarded by scripts/single-font.test.mjs.

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT = "inter-var-latin.woff2";
const source = resolve(__dirname, "..", "..", "..", "styles", "fonts", FONT);
const targetDir = join(__dirname, "..", "public", "fonts");

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, join(targetDir, FONT));
console.log(`Copied ${FONT} into public/fonts/`);
