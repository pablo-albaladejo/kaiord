import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = dirname(HERE);
const POPUP_HTML = readFileSync(join(PKG, "popup.html"), "utf8");
// Mirror popup.html script order: the vendored utils, shell and health modules
// load before the site popup.js and share the page's global scope.
const POPUP_SCRIPTS = [
  "bridge-popup-utils.js",
  "bridge-popup-shell.js",
  "bridge-popup-health.js",
  "popup.js",
].map((file) => readFileSync(join(PKG, file), "utf8"));

const MOCK_NOW_MS = new Date("2026-05-02T10:00:00Z").getTime();
const BROKEN_AT_MS = new Date("2026-04-23T08:00:00Z").getTime();

const setupDom = (chromeMock) => {
  const dom = new JSDOM(POPUP_HTML, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "chrome-extension://fake/popup.html",
  });
  dom.window.chrome = chromeMock;
  dom.window.Date.now = () => MOCK_NOW_MS;
  // Concatenated into ONE eval: real <script> tags share the page's global
  // lexical scope, but separate indirect evals do not.
  dom.window.eval(POPUP_SCRIPTS.join("\n;\n"));
  return dom;
};

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

// `health` seeds chrome.storage.local as a previous popup open would have left
// it; `__store` is readable afterwards so a test can assert what was written.
const buildChromeMock = ({ sessionResponse, health } = {}) => {
  const store = health ? { bridgeHealth: health } : {};
  return {
    runtime: {
      sendMessage: vi.fn((msg, cb) => {
        if (msg.action === "checkSession") cb(sessionResponse);
        else cb({ ok: false, error: "unknown" });
      }),
      lastError: undefined,
    },
    storage: {
      local: {
        get: vi.fn((keys, cb) => {
          const out = {};
          for (const key of keys) if (key in store) out[key] = store[key];
          cb(out);
        }),
        set: vi.fn((items, cb) => {
          Object.assign(store, items);
          if (cb) cb();
        }),
      },
    },
    __store: store,
  };
};

const open = async (chromeMock) => {
  const dom = setupDom(chromeMock);
  dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  await flushAsync();
  await flushAsync();
  await flushAsync();
  return dom.window.document;
};

describe("TrainingPeaks popup", () => {
  it("renders connected state with feed chips and the editor as primary CTA", async () => {
    const doc = await open(
      buildChromeMock({
        sessionResponse: {
          ok: true,
          data: { authenticated: true, athleteId: 1234 },
        },
      })
    );

    expect(doc.getElementById("status").className).toContain(
      "status-block--ok"
    );
    expect(doc.getElementById("status-text").textContent).toBe("Connected");
    const chips = doc.getElementById("chips-region");
    expect(chips.textContent).toContain("Feeds Kaiord");
    expect(
      [...chips.querySelectorAll(".chip")].map((c) => c.textContent)
    ).toEqual(["Weight"]);
    // The `push-weight` action exists in the bridge but no Kaiord export route
    // drives it, so it must NOT read as something that flows today.
    const future = doc.getElementById("future-region");
    expect(future.textContent).toContain("Will feed Kaiord");
    expect(future.querySelectorAll(".chip--dashed").length).toBe(1);
    expect(future.textContent).toContain("Weight ↑ back to TrainingPeaks");
    expect(doc.querySelectorAll(".chip--out").length).toBe(0);
    expect(chips.querySelectorAll(".chip--dashed").length).toBe(0);
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open TrainingPeaks ↗"
    );
  });

  it("renders not-signed-in state with the value prop and TrainingPeaks as primary CTA", async () => {
    const doc = await open(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: false } },
      })
    );

    expect(doc.getElementById("status").className).toContain(
      "status-block--muted"
    );
    expect(doc.getElementById("status-text").textContent).toBe("Not signed in");
    expect(doc.getElementById("status-sub").textContent).toContain(
      "no password stored"
    );
    expect(doc.getElementById("chips-region").textContent).toContain(
      "Will feed Kaiord"
    );
    // Nothing flows in either direction yet: one dashed row covers both, and
    // the future row is cleared so the caption is not repeated.
    expect(doc.querySelectorAll(".chip--dashed").length).toBe(2);
    expect(doc.getElementById("future-region").children.length).toBe(0);
    expect(doc.getElementById("consequence-region").textContent).toBe(
      "Weight currently comes from manual entry."
    );
    // The fix lives at TrainingPeaks, not in the editor.
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Open TrainingPeaks"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Set up in Kaiord ↗"
    );
  });

  it("dates the outage once an earlier open already recorded it", async () => {
    const doc = await open(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: false } },
        health: { brokenSince: BROKEN_AT_MS },
      })
    );

    expect(doc.getElementById("status-text").textContent).toBe("Session ended");
    expect(doc.getElementById("status-sub").textContent).toContain(
      "Nothing has reached Kaiord since 23 Apr."
    );
    const mark = doc.querySelector("[data-status-mark]");
    expect(mark.tagName.toLowerCase()).toBe("svg");
    expect(mark.querySelector("use").getAttribute("href")).toBe("#i-attn");
  });

  it("does not date an outage it has only just noticed", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: false } },
    });

    const doc = await open(chromeMock);

    expect(doc.getElementById("status-text").textContent).toBe("Not signed in");
    expect(doc.querySelector("[data-status-mark]").tagName.toLowerCase()).toBe(
      "span"
    );
    expect(chromeMock.__store.bridgeHealth.brokenSince).toBe(MOCK_NOW_MS);
  });

  it("clears the outage when the session mints a token again", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: true } },
      health: { brokenSince: BROKEN_AT_MS },
    });

    await open(chromeMock);

    expect(chromeMock.__store.bridgeHealth.brokenSince).toBeUndefined();
    expect(chromeMock.__store.bridgeHealth.lastOkAt).toBe(MOCK_NOW_MS);
  });

  it("renders the checking skeleton in every region a resolved state fills", () => {
    const dom = setupDom(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: true } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe(
      "Checking your session…"
    );
    // The future row is the one this bridge used to leave empty during the
    // check and then fill on resolve — the jump this covers.
    for (const region of [
      "chips-region",
      "future-region",
      "consequence-region",
      "footer-region",
    ]) {
      expect(
        doc.querySelectorAll(`#${region} .skeleton`).length
      ).toBeGreaterThan(0);
    }
    expect(doc.querySelectorAll(".skeleton--cta").length).toBe(1);
  });

  it("dims the monogram while the identity is unestablished", async () => {
    const dom = setupDom(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: true } },
      })
    );
    const doc = dom.window.document;

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    expect(doc.getElementById("brand-mark").className).toContain(
      "popup-header__mark--muted"
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();
    expect(doc.getElementById("brand-mark").className).not.toContain(
      "popup-header__mark--muted"
    );
  });

  it("falls back to not-signed-in when the background answers with an error", async () => {
    const doc = await open(
      buildChromeMock({ sessionResponse: { ok: false, error: "boom" } })
    );

    expect(doc.getElementById("status-text").textContent).toBe("Not signed in");
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Open TrainingPeaks"
    );
  });

  it("still renders when chrome.storage is unavailable", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: false } },
    });
    delete chromeMock.storage;

    const doc = await open(chromeMock);

    expect(doc.getElementById("status-text").textContent).toBe("Not signed in");
  });

  it("carries no provider hue in its markup", () => {
    expect(POPUP_HTML).not.toContain("--accent");
    expect(POPUP_HTML).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(POPUP_HTML).toContain(">TP</span");
  });
});
