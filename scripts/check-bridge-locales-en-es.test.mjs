#!/usr/bin/env node
//
// Rule R-BridgeLocalesEnglishSpanish.
//
// Every browser extension (`packages/*-bridge`) SHALL ship its athlete-visible
// strings in English and Spanish at parity, like the Kaiord App: its
// `_locales/` holds exactly `en` and `es`, both catalogs declare the same keys
// and the same placeholders, and no message is empty. Chrome picks the
// catalog from the browser's UI language and falls back to `en`, the
// `default_locale` every manifest declares. The store name is
// "Kaiord for <Platform>" in both catalogs (GLOSSARY.md, "Bridge"): the
// product name is not translated.
//
// Every string a popup shows comes from those catalogs or from the shared
// Connection notices: popup.html carries no literal text (each element that
// shows text names its message with `data-i18n`), and the
// KAIORD_POPUP_MESSAGES fallback table in popup.js repeats the English catalog
// word for word, so it is a copy for jsdom, never a second source.
//
// Runs under `pnpm test:scripts` (gates the `test` required check).

import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
export const REQUIRED_LOCALES = ["en", "es"];

export const bridgePackages = (dir = PACKAGES_DIR) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.endsWith("-bridge"))
        .map((e) => e.name)
        .sort()
    : [];

const TABLE_START = "globalThis.KAIORD_POPUP_MESSAGES = ";

// The fallback table is a plain object literal: evaluate it alone, in an
// empty context, from its opening brace to the first `};` at column 0.
export const extractTableEntries = (src, label = "source") => {
  const open = src.indexOf(TABLE_START);
  assert.ok(open >= 0, `${label}: missing ${TABLE_START.trim()} literal`);
  const start = open + TABLE_START.length;
  const end = src.indexOf("\n};", start);
  assert.ok(end > start, `${label}: unterminated message table literal`);
  return runInNewContext(`(${src.slice(start, end + 2)})`, Object.create(null));
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const placeholdersOf = (entry) =>
  Object.keys(entry?.placeholders ?? {})
    .sort()
    .join(",");

/** Problems between two catalogs of one extension: keys, placeholders, empties. */
export function catalogProblems(where, catalogs) {
  const problems = [];
  const [en, es] = REQUIRED_LOCALES.map((locale) => catalogs[locale] ?? {});
  for (const key of Object.keys(en))
    if (!(key in es)) problems.push(`${where}: "${key}" is in en but not in es`);
  for (const key of Object.keys(es))
    if (!(key in en)) problems.push(`${where}: "${key}" is in es but not in en`);
  for (const key of Object.keys(en).filter((k) => k in es))
    if (placeholdersOf(en[key]) !== placeholdersOf(es[key]))
      problems.push(`${where}: "${key}" has different placeholders in en and es`);
  for (const locale of REQUIRED_LOCALES)
    for (const [key, entry] of Object.entries(catalogs[locale] ?? {}))
      if (typeof entry?.message !== "string" || entry.message.trim() === "")
        problems.push(`${where}: "${key}" is empty in ${locale}`);
  return problems;
}

/**
 * Text in popup.html that does not come from a catalog. An element that shows
 * text is empty in the markup and names its message with `data-i18n` (or
 * `data-i18n-aria-label`); `localizePage` fills it before first paint.
 */
export function literalHtmlText(html) {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, "");
  const found = [];
  const element = /<([a-z][a-z0-9]*)\b([^>]*)>([^<]*)/gi;
  for (const [, tag, attrs, text] of body.matchAll(element)) {
    // A mark hidden from assistive tech (the header monogram) is not language.
    const hidden = /\saria-hidden="true"/.test(attrs);
    if (text.trim() !== "" && !hidden) found.push(`<${tag}> "${text.trim()}"`);
    for (const [, attr, value] of attrs.matchAll(
      /\s(aria-label|title|alt|placeholder)="([^"]*)"/g
    ))
      if (value.trim() !== "") found.push(`${attr}="${value}"`);
  }
  return found;
}

// `$name$` in a catalog is `$1`, `$2`… in the fallback table, in declaration order.
const positional = (entry) =>
  Object.entries(entry.placeholders ?? {}).reduce(
    (text, [name, { content }]) => text.split(`$${name}$`).join(content),
    entry.message
  );

/** Fallback-table values that are not the English catalog's words. */
export function fallbackDrift(where, table, en) {
  return Object.entries(table)
    .filter(([key]) => key in en)
    .filter(([key, value]) => value !== positional(en[key]))
    .map(([key]) => `${where}: KAIORD_POPUP_MESSAGES.${key} differs from _locales/en`);
}

const platformOf = (bridge) =>
  /const PLATFORM = "([^"]+)";/.exec(
    readFileSync(join(PACKAGES_DIR, bridge, "popup.js"), "utf8")
  )?.[1];

const catalogsOf = (bridge) =>
  Object.fromEntries(
    REQUIRED_LOCALES.map((locale) => {
      const path = join(PACKAGES_DIR, bridge, "_locales", locale, "messages.json");
      return [locale, existsSync(path) ? readJson(path) : undefined];
    })
  );

describe("R-BridgeLocalesEnglishSpanish helpers", () => {
  it("should report a key missing from es, an empty message and a placeholder mismatch", () => {
    // Arrange
    const catalogs = {
      en: {
        a: { message: "One" },
        b: { message: "$n$ two", placeholders: { n: { content: "$1" } } },
        c: { message: "Three" },
      },
      es: { b: { message: "dos" }, c: { message: " " } },
    };

    // Act
    const problems = catalogProblems("x", catalogs);

    // Assert
    assert.deepEqual(problems, [
      'x: "a" is in en but not in es',
      'x: "b" has different placeholders in en and es',
      'x: "c" is empty in es',
    ]);
  });

  it("should find literal text and text attributes in popup markup but not data-i18n text", () => {
    // Arrange
    const html = [
      '<title data-i18n="extName"></title>',
      '<span aria-hidden="true">G</span>',
      '<p data-i18n="checking">Checking…</p>',
      "<!-- <p>a comment</p> -->",
      '<svg><symbol id="i"><path d="M0"/></symbol></svg>',
      "<h1>Kaiord · X</h1>",
      '<button aria-label="Refresh" data-i18n-aria-label="refresh"></button>',
      '<script src="popup.js"></script>',
    ].join("\n");

    // Act
    const found = literalHtmlText(html);

    // Assert
    assert.deepEqual(found, [
      '<p> "Checking…"',
      '<h1> "Kaiord · X"',
      'aria-label="Refresh"',
    ]);
  });

  it("should accept a fallback value that is the catalog message with positional placeholders", () => {
    // Arrange
    const en = {
      ok: { message: "Updated $phrase$", placeholders: { phrase: { content: "$1" } } },
      off: { message: "Feeds Kaiord" },
    };

    // Act
    const drift = fallbackDrift("x", { ok: "Updated $1", off: "Feeds it" }, en);

    // Assert
    assert.deepEqual(drift, ["x: KAIORD_POPUP_MESSAGES.off differs from _locales/en"]);
  });
});

describe("R-BridgeLocalesEnglishSpanish", () => {
  const bridges = bridgePackages();

  it("should discover the five extensions (not a silent no-op)", () => {
    // Arrange
    const expected = 5;

    // Act
    const found = bridges.length;

    // Assert
    assert.equal(found, expected, `found ${bridges}`);
  });

  it("should ship exactly the en and es locales in every extension", () => {
    // Arrange
    const wrong = [];

    // Act
    for (const bridge of bridges) {
      const dir = join(PACKAGES_DIR, bridge, "_locales");
      const locales = existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name)
            .sort()
        : [];
      if (locales.join() !== REQUIRED_LOCALES.join())
        wrong.push(`packages/${bridge}/_locales holds [${locales}]`);
    }

    // Assert
    assert.deepEqual(wrong, [], `every extension ships en and es only:\n  ${wrong.join("\n  ")}`);
  });

  it("should declare the same keys and placeholders in en and es, none empty", () => {
    // Arrange
    const problems = [];

    // Act
    for (const bridge of bridges)
      problems.push(...catalogProblems(`packages/${bridge}/_locales`, catalogsOf(bridge)));

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should name every extension Kaiord for its Platform in both locales and every manifest", () => {
    // Arrange
    const problems = [];

    // Act
    for (const bridge of bridges) {
      const name = `Kaiord for ${platformOf(bridge)}`;
      for (const [locale, catalog] of Object.entries(catalogsOf(bridge)))
        if (catalog?.extName?.message !== name)
          problems.push(`${bridge} ${locale}: extName is not "${name}"`);
      for (const file of ["manifest.json", "manifest.prod.json"]) {
        const m = readJson(join(PACKAGES_DIR, bridge, file));
        if (m.name !== "__MSG_extName__" || m.description !== "__MSG_extDescription__" || m.default_locale !== "en")
          problems.push(`${bridge}/${file}: name, description or default_locale is not from _locales`);
        if (m.action?.default_title !== undefined && m.action.default_title !== "__MSG_extName__")
          problems.push(`${bridge}/${file}: action.default_title is not from _locales`);
      }
    }

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should keep the name and description within the Chrome Web Store limits in both locales", () => {
    // Arrange
    // Chrome caps an extension's name at 75 characters and its description
    // at 132; the store shows each locale's own.
    const limits = { extName: 75, extDescription: 132 };
    const over = [];

    // Act
    for (const bridge of bridges)
      for (const [locale, catalog] of Object.entries(catalogsOf(bridge)))
        for (const [key, max] of Object.entries(limits))
          if ((catalog?.[key]?.message ?? "").length > max)
            over.push(`${bridge} ${locale}: ${key} is over ${max} characters`);

    // Assert
    assert.deepEqual(over, []);
  });

  it("should take every popup string from _locales or the shared notices", () => {
    // Arrange
    const problems = [];

    // Act
    for (const bridge of bridges) {
      const html = readFileSync(join(PACKAGES_DIR, bridge, "popup.html"), "utf8");
      for (const text of literalHtmlText(html))
        problems.push(`packages/${bridge}/popup.html: literal ${text}`);
      for (const [, key] of html.matchAll(/data-i18n(?:-[a-z-]+)?="([A-Za-z0-9_]+)"/g))
        if (!(key in catalogsOf(bridge).en))
          problems.push(`packages/${bridge}/popup.html: data-i18n "${key}" is not in _locales/en`);
      const src = readFileSync(join(PACKAGES_DIR, bridge, "popup.js"), "utf8");
      problems.push(
        ...fallbackDrift(`packages/${bridge}/popup.js`, extractTableEntries(src, bridge), catalogsOf(bridge).en)
      );
    }

    // Assert
    assert.deepEqual(problems, []);
  });
});
