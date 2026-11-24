// @vitest-environment node
//
// Kaiord Bridge Core — vendored popup language suite.
// Master: packages/_shared/bridge-core/test/popup-locales.test.js. Never edit
// a vendored copy — edit the master and run `pnpm bridge:sync`. Every bridge
// runs it against its own popup.html, popup scripts and _locales.
//
// The popup speaks the browser's UI language, English or Spanish
// (R-BridgeLocalesEnglishSpanish): Chrome renders the catalog of that
// language, and the Connection notice follows it (the outage date is pinned
// by the bridge-popup-utils suite). A
// Platform that does not answer is the one broken state every popup reaches
// the same way, so it carries the check.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

const PKG = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (file) => readFileSync(join(PKG, file), "utf8");
const POPUP_HTML = read("popup.html");
const SCRIPTS = [...POPUP_HTML.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(([, src]) => src)
  .filter((src) => src !== "bridge-theme.js");
const PLATFORM = /const PLATFORM = "([^"]+)";/.exec(read("popup.js"))[1];

// Chrome's getMessage: the catalog's `$name$` placeholders resolve to their
// `$1`… content, which the substitutions fill.
const getMessageFrom = (catalog) => (key, subs) => {
  const entry = catalog[key];
  if (!entry) return "";
  const list = subs == null ? [] : [].concat(subs);
  return Object.entries(entry.placeholders ?? {})
    .reduce(
      (text, [name, { content }]) => text.split(`$${name}$`).join(content),
      entry.message
    )
    .replace(/\$(\d)/g, (_, i) => String(list[Number(i) - 1] ?? ""));
};

const storageArea = (store) => ({
  get: vi.fn((keys, cb) => {
    const out = {};
    for (const k of [].concat(keys ?? [])) out[k] = store[k];
    cb?.(out);
    return Promise.resolve(out);
  }),
  set: vi.fn((items, cb) => {
    Object.assign(store, items);
    cb?.();
    return Promise.resolve();
  }),
  remove: vi.fn((_keys, cb) => {
    cb?.();
    return Promise.resolve();
  }),
});

const openPopup = async (language) => {
  const catalog = JSON.parse(read(`_locales/${language}/messages.json`));
  const dom = new JSDOM(POPUP_HTML, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "chrome-extension://fake/popup.html",
  });
  dom.window.chrome = {
    i18n: {
      getUILanguage: () => (language === "es" ? "es-ES" : "en-US"),
      getMessage: getMessageFrom(catalog),
    },
    runtime: {
      lastError: undefined,
      sendMessage: vi.fn((_message, cb) => cb?.({ ok: false, error: "down" })),
    },
    storage: {
      local: storageArea({}),
      session: storageArea({}),
    },
    tabs: { query: vi.fn((_q, cb) => cb?.([])), create: vi.fn() },
  };
  dom.window.eval(SCRIPTS.map(read).join("\n;\n"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  for (let i = 0; i < 10; i += 1) await new Promise((r) => setTimeout(r, 0));
  return dom.window.document;
};

const footerText = (doc) =>
  doc.getElementById("footer-region").textContent.trim();

describe(`${PLATFORM} popup languages`, () => {
  it("should name the extension and word a Platform that does not answer in Spanish", async () => {
    // Arrange
    const language = "es";

    // Act
    const doc = await openPopup(language);

    // Assert
    expect(doc.documentElement.lang).toBe("es");
    expect(doc.title).toBe(`Kaiord for ${PLATFORM}`);
    expect(doc.querySelector(".popup-header__title").textContent).toBe(
      `Kaiord for ${PLATFORM}`
    );
    expect(doc.getElementById("refresh-btn").getAttribute("aria-label")).toBe(
      "Actualizar"
    );
    expect(doc.getElementById("status-text").textContent).toBe(
      `${PLATFORM} no responde, así que ahora mismo no puedes usarlo en Kaiord.`
    );
    expect(footerText(doc)).toBe("Reintentar");
  });

  it("should name the extension and word a Platform that does not answer in English", async () => {
    // Arrange
    const language = "en";

    // Act
    const doc = await openPopup(language);

    // Assert
    expect(doc.documentElement.lang).toBe("en");
    expect(doc.title).toBe(`Kaiord for ${PLATFORM}`);
    expect(doc.getElementById("refresh-btn").getAttribute("aria-label")).toBe(
      "Refresh"
    );
    expect(doc.getElementById("status-text").textContent).toBe(
      `${PLATFORM} is not answering, so you cannot use it in Kaiord right now.`
    );
    expect(footerText(doc)).toBe("Try again");
  });
});
