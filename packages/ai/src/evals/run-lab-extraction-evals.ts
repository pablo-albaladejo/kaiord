#!/usr/bin/env tsx
/**
 * UNMEASURED BY CONSTRUCTION. The lab-extraction case sends the report as a
 * document file part, and the only live model access this project has
 * (`claude -p` behind the live loader) takes a text prompt on stdin, so it
 * cannot carry it. This runner does not import the live loader: it reports
 * the case as unmeasured with that reason and exits 0. It never reaches the
 * `EVAL_LIVE` opt-in and never fails. The scorer and the fixture are still
 * checked on every commit by their unit tests, which need no model.
 */
const CASE_ID = "lab-extraction-synthetic-report";
const REASON =
  "document file parts: the claude -p live lane takes a text prompt only";

console.log(`[UNMEASURED] ${CASE_ID} - ${REASON}`);
console.log("\n0 measured, 1 unmeasured.");
process.exit(0);
