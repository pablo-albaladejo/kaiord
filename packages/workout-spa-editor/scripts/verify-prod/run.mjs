import { stripVTControlCharacters } from "node:util";

import { launchBrowser, openSession } from "./browser.mjs";
import { readEntryScript } from "./evidence.mjs";
import { formatEvidence } from "./evidence-format.mjs";
import {
  createRecorder,
  formatSummary,
  parseArgs,
  readDeployedSha,
  selectChecks,
} from "./lib.mjs";

const CHECKS = [
  "fit-import",
  "default-profile",
  "export",
  "scheduled-lifecycle",
  "new-session",
  "empty-states-mobile",
  "sleep",
  "tcx-repeat",
  "backup-import",
  "manual-first",
  "i18n-scan",
  "mobile",
  "trends",
  "intake-preset",
];

async function runCheck(browser, base, name) {
  const rec = createRecorder(name);
  const sessions = [];
  const startedAt = Date.now();
  const open = async (opts) => {
    const session = await openSession(browser, base, { ...opts, startedAt });
    sessions.push(session);
    return session;
  };
  try {
    const { default: check } = await import(`./checks/${name}.mjs`);
    await check({ base, rec, open });
  } catch (err) {
    const lines = stripVTControlCharacters(String(err.message)).split("\n");
    const target = lines.find((l) => l.includes("waiting for")) ?? "";
    rec.fail(`threw: ${lines[0]} ${target.trim()}`);
  } finally {
    for (const s of sessions) {
      const pageErrors = s.errors.filter((e) => e.startsWith("pageerror"));
      for (const e of pageErrors) rec.note(e);
      await s.ctx.close();
    }
    if (rec.result.failed.length > 0 || rec.result.passed.length === 0) {
      rec.result.evidence = formatEvidence(
        name,
        sessions.map((s) => s.evidence)
      );
    }
  }
  return rec.result;
}

const args = parseArgs(process.argv.slice(2));
const names = selectChecks(CHECKS, args.only);
const sha = await readDeployedSha(args.base);
const entry = await readEntryScript(args.base);
console.log(`verify:prod against ${args.base} (sha=${sha} entry=${entry})`);
const browser = await launchBrowser();
const results = [];
try {
  for (const name of names) {
    const result = await runCheck(browser, args.base, name);
    console.log(`${result.failed.length ? "FAIL" : "done"}  ${name}`);
    results.push(result);
  }
} finally {
  await browser.close();
}
const summary = formatSummary(results, { sha, base: args.base, entry });
console.log(`\n${summary.text}`);
process.exitCode = summary.exitCode;
