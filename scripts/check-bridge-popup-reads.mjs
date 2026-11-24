#!/usr/bin/env node
/**
 * Mechanical guard: ADR 0004's bounded exception stays bounded.
 *
 * A working extension's popup may read and interpret data only for its own
 * window, when the athlete opens it, through the same closed list of paths,
 * without storing it beyond the popup's lifetime and without ever handing
 * it to the Kaiord App. Each bridge's background.js declares its popup's
 * reads (`POPUP_READS`, the internal actions that read for the popup) and
 * the scripts only they use (`POPUP_READ_SCRIPTS`), possibly empty. From the
 * TypeScript AST it fails when:
 *
 *   - R-PopupReadsDeclared: the two are not declared as literals, a popup
 *     read is an external action, or the popup cannot send it;
 *   - R-PopupReadsUnreachable: an action that is not a popup read (every
 *     App-facing action included) reaches, through the top-level bindings,
 *     a popup read's handler or a popup-read script, or a content script
 *     loads one;
 *   - R-PopupReadsClosedList: a path a popup read spells matches no entry of
 *     `ALLOWED`, code a popup read reaches calls `fetch` without `isAllowed`,
 *     or a popup-read script touches `fetch`, `XMLHttpRequest`, `chrome` or
 *     `importScripts`;
 *   - R-PopupReadsNotStored: code a popup read reaches touches
 *     `chrome.storage`, popup.js writes it, or any shipped file of the bridge
 *     writes a key outside its list in `bridge-popup-reads.vocab.mjs` (each
 *     with the reason it is not popup-read data), or keys the source does
 *     not spell.
 *
 * Finding no bridge is a fault, not a pass.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { STORAGE_KEYS } from "./bridge-popup-reads.vocab.mjs";
import { shippedSources } from "./lib/bridge-origin-scan.mjs";
import {
  actionCases,
  closedList,
  closureOf,
  declaredStrings,
  namesUsed,
  parse,
  pathLiterals,
  storageWrites,
  topLevelBindings,
  touchesStorage,
} from "./lib/bridge-popup-reads-ast.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DECLARED = "R-PopupReadsDeclared";
const UNREACHABLE = "R-PopupReadsUnreachable";
const CLOSED = "R-PopupReadsClosedList";
const NOT_STORED = "R-PopupReadsNotStored";
const SCRIPT_FORBIDDEN = new Set([
  "fetch",
  "XMLHttpRequest",
  "chrome",
  "importScripts",
]);

const issue = (rule, file, detail) => ({ rule, file, detail });

// Bindings loaded from a popup-read script: `loadScript("x.js")`,
// `require("./x.js")` or `importScripts("x.js")` in their code.
const scriptBindings = (bindings, scripts) =>
  [...bindings]
    .filter(([, nodes]) =>
      nodes.some((node) =>
        scripts.some((file) =>
          new RegExp(`["'\`](?:\\./)?${file.replace(".", "\\.")}["'\`]`).test(
            node.getText()
          )
        )
      )
    )
    .map(([name]) => name);

const contentScriptFiles = (dir) =>
  ["manifest.json", "manifest.prod.json"].flatMap((file) => {
    const path = join(dir, file);
    if (!existsSync(path)) return [];
    const m = JSON.parse(readFileSync(path, "utf8"));
    return (m.content_scripts ?? []).flatMap((s) => s.js ?? []);
  });

const declarations = (rel, bindings) => {
  const reads = declaredStrings(bindings, "POPUP_READS");
  const scripts = declaredStrings(bindings, "POPUP_READ_SCRIPTS");
  const external = declaredStrings(bindings, "EXTERNAL_ACTIONS") ?? [];
  const internal = declaredStrings(bindings, "INTERNAL_ACTIONS") ?? [];
  const found = [];
  if (reads === null || scripts === null) {
    found.push(
      issue(
        DECLARED,
        rel,
        "declares no POPUP_READS / POPUP_READ_SCRIPTS literal"
      )
    );
  }
  for (const action of reads ?? []) {
    if (external.includes(action)) {
      found.push(
        issue(DECLARED, rel, `popup read "${action}" is an external action`)
      );
    }
    if (!internal.includes(action)) {
      found.push(
        issue(DECLARED, rel, `popup read "${action}" is not an internal action`)
      );
    }
  }
  return { reads: reads ?? [], scripts: scripts ?? [], found };
};

const checkBackground = (repoRoot, name) => {
  const dir = join(repoRoot, "packages", name);
  const rel = join("packages", name, "background.js");
  const path = join(repoRoot, rel);
  if (!existsSync(path)) return [issue(DECLARED, rel, "has no background.js")];
  const source = parse(path, readFileSync(path, "utf8"));
  const bindings = topLevelBindings(source);
  const { reads, scripts, found } = declarations(rel, bindings);
  if (found.some((v) => /declares no/.test(v.detail))) return found;
  const cases = actionCases(bindings);
  if (cases === null)
    return [...found, issue(DECLARED, rel, "has no handleAction switch")];

  const handlers = reads.flatMap((a) =>
    [...(cases.get(a) ?? [])].filter(
      (n) => bindings.has(n) && !/^(message|undefined)$/.test(n)
    )
  );
  const loaded = scriptBindings(bindings, scripts);
  const popupOnly = new Set([...handlers, ...loaded]);
  for (const [action, names] of cases) {
    if (reads.includes(action)) continue;
    for (const hit of closureOf(bindings, names)) {
      if (popupOnly.has(hit)) {
        found.push(
          issue(
            UNREACHABLE,
            rel,
            `"${action}" reaches ${hit}, popup-only reading code`
          )
        );
      }
    }
  }
  for (const file of contentScriptFiles(dir)) {
    if (scripts.includes(file)) {
      found.push(
        issue(
          UNREACHABLE,
          rel,
          `a content script loads ${file}, a popup-read script`
        )
      );
    }
  }

  const allowed = closedList(bindings);
  const reached = closureOf(bindings, handlers);
  for (const handler of handlers) {
    for (const node of bindings.get(handler)) {
      for (const lit of pathLiterals(node)) {
        if (!lit.paths.some((p) => allowed.some((re) => re.test(p)))) {
          found.push(
            issue(
              CLOSED,
              rel,
              `${handler} asks for ${lit.text}, on no entry of ALLOWED`
            )
          );
        }
      }
    }
  }
  for (const n of reached) {
    const nodes = bindings.get(n);
    const used = new Set(nodes.flatMap((node) => [...namesUsed(node)]));
    if (used.has("fetch") && !used.has("isAllowed")) {
      found.push(issue(CLOSED, rel, `${n} fetches without isAllowed`));
    }
    if (nodes.some(touchesStorage)) {
      found.push(
        issue(
          NOT_STORED,
          rel,
          `${n}, reached by a popup read, touches chrome.storage`
        )
      );
    }
  }
  for (const file of scripts) {
    const srcPath = join(dir, file);
    if (!existsSync(srcPath)) {
      found.push(
        issue(DECLARED, rel, `POPUP_READ_SCRIPTS names missing ${file}`)
      );
      continue;
    }
    const used = namesUsed(parse(srcPath, readFileSync(srcPath, "utf8")));
    for (const bad of SCRIPT_FORBIDDEN) {
      if (used.has(bad)) {
        found.push(
          issue(
            CLOSED,
            join("packages", name, file),
            `a popup-read script uses ${bad}`
          )
        );
      }
    }
  }
  return found;
};

const checkStorage = (repoRoot, name, keys) =>
  shippedSources(join(repoRoot, "packages", name)).flatMap((path) => {
    const rel = path.slice(repoRoot.length + 1);
    const writes = storageWrites(parse(path, readFileSync(path, "utf8")));
    if (basename(path) === "popup.js") {
      return writes.map((w) =>
        issue(
          NOT_STORED,
          rel,
          `the popup itself calls chrome.storage …${w.method} (line ${w.line})`
        )
      );
    }
    return writes.flatMap((w) =>
      w.keys
        .filter((k) => k === null || !Object.hasOwn(keys, k))
        .map((k) =>
          issue(
            NOT_STORED,
            rel,
            k === null
              ? `writes chrome.storage keys the source does not spell (line ${w.line})`
              : `writes "${k}", not on its list in bridge-popup-reads.vocab.mjs (line ${w.line})`
          )
        )
    );
  });

export function runCheck({ repoRoot = REPO, storageKeys = STORAGE_KEYS } = {}) {
  const packages = join(repoRoot, "packages");
  const bridges = readdirSync(packages)
    .filter(
      (n) => n.endsWith("-bridge") && statSync(join(packages, n)).isDirectory()
    )
    .sort();
  if (bridges.length === 0) {
    return [issue(DECLARED, "packages", "found no bridge to check")];
  }
  return bridges.flatMap((name) => [
    ...checkBackground(repoRoot, name),
    ...checkStorage(repoRoot, name, storageKeys[name] ?? {}),
  ]);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  failIfAny(
    "place(s) where a popup read is not bounded to its popup",
    runCheck().map((v) => `[${v.rule}] ${v.file} — ${v.detail}`),
    "Remediation: keep popup-only reading behind POPUP_READS (internal, never external), on ALLOWED through isAllowed, and out of chrome.storage; list any new storage key with its reason in scripts/bridge-popup-reads.vocab.mjs (docs/adr/0004)."
  );
  console.log(
    "✅ Every popup read stays in its popup: unreachable from the App, on the closed list, never stored."
  );
}
