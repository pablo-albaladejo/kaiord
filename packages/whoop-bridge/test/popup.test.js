import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = dirname(HERE);
const POPUP_HTML = readFileSync(join(PKG, "popup.html"), "utf8");
// Mirror popup.html script order: the vendored utils and shell modules load
// before the site popup.js and share the page's global scope.
const POPUP_SCRIPTS = [
  "bridge-popup-utils.js",
  "bridge-popup-shell.js",
  "popup.js",
].map((file) => readFileSync(join(PKG, file), "utf8"));

const MOCK_NOW_MS = new Date("2026-05-02T10:00:00Z").getTime();

const setupDom = (chromeMock) => {
  const dom = new JSDOM(POPUP_HTML, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "chrome-extension://fake/popup.html",
  });
  dom.window.chrome = chromeMock;
  // popup.js runs inside the JSDOM window via `eval`, so relativeAgo resolves
  // `Date.now` against `dom.window.Date`. Mock both so the "Captured N hours
  // ago" line is deterministic relative to the fixture timestamps.
  dom.window.Date.now = () => MOCK_NOW_MS;
  // Concatenated into ONE eval: real <script> tags share the page's global
  // lexical scope, but separate indirect evals do not.
  dom.window.eval(POPUP_SCRIPTS.join("\n;\n"));
  return dom;
};

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

const buildChromeMock = ({ statusResponse } = {}) => ({
  runtime: {
    sendMessage: vi.fn((msg, cb) => {
      if (msg.action === "status") cb(statusResponse);
      else cb({ ok: false, error: "unknown" });
    }),
  },
});

describe("WHOOP popup", () => {
  let originalNow;

  beforeEach(() => {
    originalNow = Date.now;
    Date.now = () => MOCK_NOW_MS;
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  it("renders connected state with feed chips and the editor as primary CTA", async () => {
    const dom = setupDom(
      buildChromeMock({
        statusResponse: {
          ok: true,
          data: {
            connected: true,
            capturedAt: new Date("2026-05-02T07:00:00Z").getTime(),
          },
        },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status").className).toContain(
      "status-block--ok"
    );
    expect(doc.getElementById("status-text").textContent).toBe("Connected");
    expect(doc.getElementById("status-sub").textContent).toContain(
      "Captured 3 hours ago"
    );
    const chips = doc.getElementById("chips-region").textContent;
    expect(chips).toContain("Feeds Kaiord");
    expect(chips).toContain("Sleep");
    expect(chips).toContain("HRV");
    expect(chips).toContain("+3 more");
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open WHOOP ↗"
    );
    expect(doc.getElementById("paused-region").children.length).toBe(0);
  });

  it("renders signed-out state with the consequence chips and sign-in as primary CTA", async () => {
    const dom = setupDom(
      buildChromeMock({
        statusResponse: { ok: true, data: { connected: false } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status").className).toContain(
      "status-block--warn"
    );
    expect(doc.getElementById("status-text").textContent).toBe(
      "Session signed out"
    );
    expect(doc.getElementById("status-sub").textContent).toContain(
      "nothing is reaching Kaiord"
    );
    const paused = doc.getElementById("paused-region");
    expect(paused.className).toBe("chips-box");
    expect(paused.textContent).toContain("What Kaiord is missing");
    expect(paused.querySelectorAll(".chip--muted").length).toBeGreaterThan(0);
    expect(doc.getElementById("chips-region").children.length).toBe(0);
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Sign in to WHOOP"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open Kaiord editor"
    );
  });

  it("renders the checking skeleton before the probe resolves", () => {
    const dom = setupDom(
      buildChromeMock({
        statusResponse: { ok: true, data: { connected: true } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe(
      "Checking your session…"
    );
    expect(doc.querySelectorAll(".skeleton--chip").length).toBe(3);
    expect(doc.querySelectorAll(".skeleton--cta").length).toBe(1);
  });

  it("falls back to the signed-out state when the background answers with an error", async () => {
    const dom = setupDom(
      buildChromeMock({ statusResponse: { ok: false, error: "boom" } })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe(
      "Session signed out"
    );
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Sign in to WHOOP"
    );
  });
});
