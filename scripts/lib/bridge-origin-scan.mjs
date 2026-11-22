import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

// The source half of R-BridgeExactOrigin. A bridge decides who may talk to
// it in one place, the shared gate (`bridge-envelope.js`), by comparing the
// sender's origin as a whole string. Anywhere else, code that tests the App
// origin by suffix, substring, prefix or pattern is a second, looser gate.

export const GATE_FILE = "bridge-envelope.js";

const NOT_SHIPPED_DIRS = new Set(["node_modules", "test", "tests", "coverage"]);
const NOT_SHIPPED_FILE =
  /(\.test|\.spec)\.m?js$|^(vitest|eslint)\.config\.m?js$/;

/** Every `.js`/`.mjs` an extension ships, at any depth; tests and tooling left out. */
export function shippedSources(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const skip =
        entry.name.startsWith(".") || NOT_SHIPPED_DIRS.has(entry.name);
      return skip ? [] : shippedSources(path);
    }
    const isSource =
      /\.m?js$/.test(entry.name) && !NOT_SHIPPED_FILE.test(entry.name);
    return isSource ? [path] : [];
  });
}

const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, (_, lead) => lead);

const LITERAL_RULES = [
  [/\*\.kaiord\.com/, "names a *.kaiord.com wildcard"],
  [/kaiord\\\.com/, "matches the App origin by regular expression"],
];
const APP_HOST = /kaiord\.com/;
const PARTIAL =
  /\.(endsWith|startsWith|includes|indexOf|lastIndexOf|match|matchAll|search)\s*\(|\bRegExp\s*\(|\.host(name)?\b/;

const boundNames = (code) =>
  [
    ...code.matchAll(
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;]*?kaiord\.com/g
    ),
  ].map((m) => new RegExp(`(^|[^\\w$.])${m[1].replace("$", "\\$")}\\b`));

const partialMatches = (code) => {
  const names = boundNames(code);
  return code.split(/[;{}]/).flatMap((statement) => {
    const op = PARTIAL.exec(statement);
    const mentionsApp =
      APP_HOST.test(statement) || names.some((re) => re.test(statement));
    if (!op || !mentionsApp) return [];
    const how = op[1] ?? (op[0].includes("host") ? "hostname" : "new RegExp");
    return [`tests the App origin by ${how}, not as a whole string`];
  });
};

/** What is wrong with one shipped file; the gate may compare lists exactly. */
export function scanSource(file) {
  const code = stripComments(readFileSync(file, "utf8"));
  const found = LITERAL_RULES.filter(([re]) => re.test(code)).map(
    ([, detail]) => detail
  );
  if (basename(file) !== GATE_FILE) found.push(...partialMatches(code));
  return [...new Set(found)];
}
