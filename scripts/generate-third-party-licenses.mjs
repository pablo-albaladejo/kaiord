#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// THIRD-PARTY-LICENSES.md from `pnpm licenses list --prod --recursive`:
// every production dependency of the workspace packages, grouped by license.
// Local paths are dropped, so the file is the same on every machine. A
// package whose license pnpm cannot read (a "SEE LICENSE IN" file) is named
// under the agreement it ships with when it is known here.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "THIRD-PARTY-LICENSES.md";

const KNOWN_AGREEMENTS = {
  "@garmin/fitsdk": {
    license:
      "Flexible and Interoperable Data Transfer (FIT) Protocol License Agreement",
    note: "Garmin's own license, not an open-source license: https://github.com/garmin/fit-javascript-sdk/blob/main/LICENSE.txt",
  },
};

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const groupsOf = (report) => {
  const groups = new Map();
  for (const entries of Object.values(report))
    for (const entry of entries) {
      const license = KNOWN_AGREEMENTS[entry.name]?.license ?? entry.license;
      groups.set(license, [...(groups.get(license) ?? []), entry]);
    }
  return [...groups].sort(([a], [b]) => byName(a, b));
};

const section = ([license, entries]) => {
  const notes = [...new Set(entries.map((e) => KNOWN_AGREEMENTS[e.name]?.note))]
    .filter(Boolean)
    .map((note) => `${note}\n`);
  const rows = [...entries]
    .sort((a, b) => byName(a.name, b.name))
    .map(
      (e) => `| ${e.name} | ${e.versions.join(", ")} | ${e.homepage ?? ""} |`
    );
  return [
    `## ${license}`,
    "",
    ...notes,
    "| Package | Version | Homepage |",
    "| --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
};

export const renderThirdPartyLicenses = (report) =>
  [
    "# Third-Party Licenses",
    "",
    "The production dependencies of Kaiord's workspace packages, grouped by license, as `pnpm licenses list --prod --recursive` reports them. Kaiord's own code is MIT (`LICENSE`). Regenerate this file with:",
    "",
    "```bash",
    "pnpm run licenses:text",
    "```",
    "",
    ...groupsOf(report).map(section),
  ].join("\n");

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const json = execFileSync(
    "pnpm",
    ["licenses", "list", "--prod", "--recursive", "--json"],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  );
  writeFileSync(join(ROOT, OUT), renderThirdPartyLicenses(JSON.parse(json)));
  console.log(`✅ ${OUT} regenerated`);
}
