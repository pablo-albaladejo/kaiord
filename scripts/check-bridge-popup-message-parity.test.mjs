import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BRIDGE_CORE_MASTERS,
  DEFAULT_PACKAGES_DIR,
} from "./sync-bridge-core.mjs";

// Every bridge popup carries its strings in three places: `_locales/en` and
// `_locales/es` are what Chrome renders through chrome.i18n (in the browser's
// UI language), and the `globalThis.KAIORD_POPUP_MESSAGES` literal in popup.js
// is the English fallback the vitest/jsdom suites (and any locale-less
// environment) resolve instead. A key added to one and forgotten in another
// renders as `undefined` in exactly one of those worlds — the drift this
// guard kills. That the fallback repeats the English words, and that en and
// es agree, is R-BridgeLocalesEnglishSpanish
// (check-bridge-locales-en-es.test.mjs).
//
// The bridge list is derived from the popup-shell master's consumer set so a
// newly onboarded popup bridge is covered without editing this file.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);

// Manifest-level strings; they never appear in the popup's runtime table.
// `extName` does: the popup's title and header are the extension's name.
const MANIFEST_ONLY_KEYS = ["extDescription"];
const LOCALES = ["en", "es"];

const shellMaster = BRIDGE_CORE_MASTERS.find(
  (entry) => entry.master === "bridge-popup-shell.js"
);
assert.ok(
  shellMaster,
  "BRIDGE_CORE_MASTERS lost its bridge-popup-shell.js entry"
);
const BRIDGES = shellMaster.bridges;

const TABLE_START = "globalThis.KAIORD_POPUP_MESSAGES = {";

// Walk the object literal counting braces so nesting is understood rather than
// inferred from indentation. Depth-1 identifiers are the message keys; anything
// deeper belongs to a nested value and is ignored. An indentation-based scan
// would instead silently stop counting at the first nested object, shrinking
// coverage without any test turning red — so this parser throws on an
// unbalanced literal instead of guessing where it ends.
export const extractTableKeys = (src, label = "source") => {
  const open = src.indexOf(TABLE_START);
  assert.ok(open >= 0, `${label}: missing ${TABLE_START} literal`);
  let i = open + TABLE_START.length;
  let depth = 1;
  let inString = null;
  const keys = [];
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (inString) {
      if (ch === "\\") i += 1;
      else if (ch === inString) inString = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      i += 1;
      continue;
    }
    if (ch === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0) break;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const close = src.indexOf("*/", i);
      assert.ok(close > i, `${label}: unterminated block comment in the table`);
      i = close + 2;
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth -= 1;
      i += 1;
      continue;
    }
    if (depth === 1) {
      const key = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/.exec(src.slice(i));
      if (key) {
        keys.push(key[1]);
        i += key[0].length;
        continue;
      }
    }
    i += 1;
  }
  assert.equal(depth, 0, `${label}: unterminated message table literal`);
  return keys;
};

const readFallbackKeys = (bridge) =>
  extractTableKeys(
    readFileSync(join(DEFAULT_PACKAGES_DIR, bridge, "popup.js"), "utf8"),
    `${bridge}/popup.js`
  );

const readLocaleKeys = (bridge, locale = "en") => {
  const path = join(
    REPO,
    "packages",
    bridge,
    `_locales/${locale}/messages.json`
  );
  const catalog = JSON.parse(readFileSync(path, "utf8"));
  return Object.keys(catalog).filter((k) => !MANIFEST_ONLY_KEYS.includes(k));
};

describe("extractTableKeys", () => {
  it("reads every top-level key past a nested object and ignores nested ones", () => {
    const src = [
      "globalThis.KAIORD_POPUP_MESSAGES = {",
      '  before: "a",',
      "  nested: {",
      '    inner: "b",',
      '    deeper: { evenDeeper: "c" },',
      "  },",
      '  afterNested: "d",',
      '  withList: ["e", "f"],',
      '  afterList: "g",',
      "};",
      "",
      "const other = { notAKey: 1 };",
    ].join("\n");

    const keys = extractTableKeys(src, "fixture");

    assert.deepEqual(keys, [
      "before",
      "nested",
      "afterNested",
      "withList",
      "afterList",
    ]);
  });

  it("ignores colons and braces that live inside string values", () => {
    const src = [
      "globalThis.KAIORD_POPUP_MESSAGES = {",
      '  url: "https://example.test/a?x={y}",',
      "  wrapped:",
      '    "Sign in at example.test once — no password stored.",',
      '  quoted: "he said \\"hi: there\\"",',
      '  last: "z",',
      "};",
    ].join("\n");

    const keys = extractTableKeys(src, "fixture");

    assert.deepEqual(keys, ["url", "wrapped", "quoted", "last"]);
  });

  it("fails loudly on an unbalanced literal instead of guessing its end", () => {
    const src = 'globalThis.KAIORD_POPUP_MESSAGES = {\n  nested: { a: "b",\n';

    assert.throws(
      () => extractTableKeys(src, "fixture"),
      /unterminated message table literal/
    );
  });

  it("fails loudly when the table literal is absent", () => {
    assert.throws(
      () => extractTableKeys("const nothing = 1;\n", "fixture"),
      /missing globalThis\.KAIORD_POPUP_MESSAGES/
    );
  });
});

describe("bridge popup message parity", () => {
  it("covers every bridge that vendors the popup shell", () => {
    assert.ok(
      BRIDGES.length >= 5,
      `expected all popup bridges, got ${BRIDGES}`
    );
  });

  it("each popup.js fallback table has the same keys as its en and es catalogs", () => {
    for (const bridge of BRIDGES) {
      const fallback = readFallbackKeys(bridge);
      for (const code of LOCALES) {
        const locale = readLocaleKeys(bridge, code);
        const missingFromTable = locale.filter((k) => !fallback.includes(k));
        const missingFromLocale = fallback.filter((k) => !locale.includes(k));
        assert.deepEqual(
          missingFromTable,
          [],
          `${bridge}: keys in _locales/${code}/messages.json but not in KAIORD_POPUP_MESSAGES`
        );
        assert.deepEqual(
          missingFromLocale,
          [],
          `${bridge}: keys in KAIORD_POPUP_MESSAGES but not in _locales/${code}/messages.json`
        );
      }
    }
  });

  it("declares no duplicate keys in a fallback table", () => {
    for (const bridge of BRIDGES) {
      const fallback = readFallbackKeys(bridge);
      assert.equal(
        new Set(fallback).size,
        fallback.length,
        `${bridge}: duplicate key in KAIORD_POPUP_MESSAGES`
      );
    }
  });

  it("declares the manifest-only keys in every en and es catalog", () => {
    for (const bridge of BRIDGES) {
      for (const code of LOCALES) {
        const where = `_locales/${code}/messages.json`;
        const path = join(REPO, "packages", bridge, where);
        const catalog = JSON.parse(readFileSync(path, "utf8"));
        for (const key of ["extName", ...MANIFEST_ONLY_KEYS]) {
          assert.ok(catalog[key], `${bridge}: ${where} lacks ${key}`);
        }
      }
    }
  });
});
