#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { loadRegisters, repoReader } from "./check-claims.mjs";
import { athleteTexts as collectAthleteTexts } from "./check-connection-notices.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";
import { surfaceUnits } from "./lib/claims-units.mjs";
import {
  ALLOWED,
  ATHLETE_ALLOWED,
  ATHLETE_FILES,
  ATHLETE_TERMS,
  FILES,
  TERMS,
} from "./retired-terms.vocab.mjs";

// No public text uses a word GLOSSARY.md retired or withdrew: framework,
// cockpit, lossless, zero data loss, round-trip safe, open standard,
// interchange format (for KRD), and platform for Kaiord itself. It reads
// every surface registered in claims/*.json, English and Spanish, and the
// FILES of retired-terms.vocab.mjs whole.
//
// It also holds "bridge" and "the Kaiord extension" off every athlete-facing
// text (ATHLETE_TERMS): the registered surfaces, the App's dictionaries and UI
// copy, the extensions' _locales and popups, and ATHLETE_FILES. The rest of
// the glossary's _Avoid_ lists (user, push, session...) is not enforced here:
// the App's verbs and states change in #1661, which adds its words when the
// texts can pass.

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

export function checkAthleteTerms({
  registers,
  read,
  files = ATHLETE_FILES,
  athleteTexts = collectAthleteTexts(),
  terms = ATHLETE_TERMS,
  allowed = ATHLETE_ALLOWED,
}) {
  // A listed file is read whole; a { file, sections } entry only in those
  // sections, the way a claims register reads it.
  const sections = files.filter((f) => typeof f !== "string");
  const texts = [
    ...publicTexts({
      registers: [...registers, { data: { surfaces: sections } }],
      read,
      files: files.filter((f) => typeof f === "string"),
    }),
    ...athleteTexts,
  ];
  const stale = allowed
    .filter(({ phrase }) => !texts.some(({ text }) => text.includes(phrase)))
    .map(
      ({ phrase }) =>
        `ALLOWED phrase "${phrase}" is on no athlete-facing text: remove it from retired-terms.vocab.mjs`
    );
  return [
    ...texts.flatMap(({ where, text, missing }) =>
      missing
        ? [`${where}: listed in retired-terms.vocab.mjs but does not exist`]
        : retiredTermProblems(where, text, { terms, allowed })
    ),
    ...stale,
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const registers = loadRegisters();
  failIfAny(
    "retired-term problem(s)",
    [
      ...checkRetiredTerms({ registers, read: repoReader }),
      ...checkAthleteTerms({ registers, read: repoReader }),
    ],
    "Use the GLOSSARY.md word, or add the exact phrase to ALLOWED in scripts/retired-terms.vocab.mjs with its reason."
  );
  console.log("✅ No public text uses a retired or withdrawn term");
}
