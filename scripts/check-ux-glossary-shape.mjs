#!/usr/bin/env node
/**
 * Mechanical guard: the UX glossary at
 * `packages/workout-spa-editor/docs/ux-glossary.md` is the
 * single source of truth for user-facing copy in the spa editor.
 *
 * Rule R-UXGlossaryShape — the glossary file MUST exist and MUST
 * contain the three top-level sections that downstream tooling will
 * parse in later iterations:
 *
 *   - `## Verbs (one per goal)`
 *   - `## Nouns`
 *   - `## State labels (visible to user)`
 *
 * It MUST also contain at least one canonical-verb row in the Verbs
 * table (matched by the literal `**Create**` cell). The script only
 * enforces the SHAPE today; verb-level enforcement (R-CTACopy) ships
 * in a follow-up PR once the existing call-sites are aligned with the
 * glossary.
 *
 * Why a shape guard instead of a verb-enforcement guard now: the
 * existing source tree intentionally still uses some legacy CTA copy
 * (see PR #615 review notes); enforcing the verbs today would block
 * every commit. The shape guard prevents accidental deletion or
 * structural breakage of the glossary so the follow-up PR can rely on
 * a well-formed input.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const GLOSSARY_PATH = resolve(
  REPO_ROOT,
  "packages/workout-spa-editor/docs/ux-glossary.md"
);

const REQUIRED_HEADINGS = [
  "## Verbs (one per goal)",
  "## Nouns",
  "## State labels (visible to user)",
];

const REQUIRED_VERB_ROW_MARKER = "**Create**";

export function checkGlossaryShape(text) {
  const errors = [];
  for (const heading of REQUIRED_HEADINGS) {
    if (!text.includes(heading)) {
      errors.push(`R-UXGlossaryShape: missing required heading: "${heading}"`);
    }
  }
  if (!text.includes(REQUIRED_VERB_ROW_MARKER)) {
    errors.push(
      `R-UXGlossaryShape: missing canonical-verb row marker: "${REQUIRED_VERB_ROW_MARKER}"`
    );
  }
  return errors;
}

function main() {
  if (!existsSync(GLOSSARY_PATH)) {
    console.error(
      `R-UXGlossaryShape: glossary file not found at ${GLOSSARY_PATH}`
    );
    process.exit(1);
  }
  const text = readFileSync(GLOSSARY_PATH, "utf8");
  const errors = checkGlossaryShape(text);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
  console.log(`R-UXGlossaryShape: ${GLOSSARY_PATH} — OK`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
