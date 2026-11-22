#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { loadRegisters, repoReader } from "./check-claims.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";
import { surfaceUnits } from "./lib/claims-units.mjs";
import { ALLOWED, FILES, TERMS } from "./retired-terms.vocab.mjs";

// No public text uses a word GLOSSARY.md retired or withdrew: framework,
// cockpit, lossless, zero data loss, round-trip safe, open standard,
// interchange format (for KRD), and platform for Kaiord itself. It reads
// every surface registered in claims/*.json, English and Spanish, and the
// FILES of retired-terms.vocab.mjs whole.
//
// The rest of the glossary's _Avoid_ lists (user, bridge, push, session...)
// is not enforced here: the extensions are still named "... Bridge" until
// #1646 renames them, and the App's verbs and states change in #1661. Those
// tickets add their words to this guard when the texts can pass it.

const withoutAllowed = (text, allowed) =>
  allowed.reduce((t, { phrase }) => t.split(phrase).join(" "), text);

export const retiredTermProblems = (
  where,
  text,
  { terms = TERMS, allowed = ALLOWED } = {}
) => {
  const checked = withoutAllowed(text, allowed);
  return terms
    .filter(({ pattern }) => pattern.test(checked))
    .map(({ term, pattern, why }) => {
      const found = checked.match(pattern)[0];
      return `${where}: "${found}" (${term}, ${why})`;
    });
};

// [{ where, text }] for every registered surface unit and every FILE.
export const publicTexts = ({ registers, read, files }) => {
  const texts = [];
  for (const { data } of registers)
    for (const surface of data.surfaces) {
      const src = read(surface.file);
      const { units = [] } = src === null ? {} : surfaceUnits(surface, src);
      texts.push(...units.map((text) => ({ where: surface.file, text })));
    }
  for (const file of files) {
    const src = read(file);
    texts.push({ where: file, text: src ?? "", missing: src === null });
  }
  return texts;
};

export function checkRetiredTerms({
  registers,
  read,
  files = FILES,
  ...vocab
}) {
  return publicTexts({ registers, read, files }).flatMap(
    ({ where, text, missing }) =>
      missing
        ? [`${where}: listed in retired-terms.vocab.mjs but does not exist`]
        : retiredTermProblems(where, text, vocab)
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  failIfAny(
    "retired-term problem(s)",
    checkRetiredTerms({ registers: loadRegisters(), read: repoReader }),
    "Use the GLOSSARY.md word, or add the exact phrase to ALLOWED in scripts/retired-terms.vocab.mjs with its reason."
  );
  console.log("✅ No public text uses a retired or withdrawn term");
}
