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
  "connection-notices.js",
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
// it; `store` is readable afterwards so a test can assert what was written.
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

describe("Tanita popup", () => {
  it("renders connected state with feed chips and the editor as primary CTA", async () => {
    const doc = await open(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: true } },
      })
    );

    expect(doc.getElementById("status").className).toContain(
      "status-block--ok"
    );
    expect(doc.getElementById("status-text").textContent).toBe("Connected");
    const chips = doc.getElementById("chips-region").textContent;
    expect(chips).toContain("Feeds Kaiord");
    expect(chips).toContain("Weight");
    expect(chips).toContain("Body Composition");
    expect(doc.querySelectorAll(".chip--dashed").length).toBe(0);
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open MyTANITA ↗"
    );
  });

  it("offers Try again, never a sign-out it cannot verify, when the export is out of reach", async () => {
    const doc = await open(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: false } },
      })
    );

    // Today's check folds a refused sign-in into the same answer as a Tanita
    // outage, so the notice names no cause and offers Try again.
    expect(doc.getElementById("status").className).toContain(
      "status-block--warn"
    );
    expect(doc.getElementById("status-text").textContent).toBe(
      "Tanita is not answering, so you cannot use it in Kaiord right now."
    );
    expect(doc.getElementById("status-sub").hidden).toBe(true);
    expect(doc.body.textContent).not.toMatch(/signed out|not signed in/i);
    expect(doc.getElementById("chips-region").children.length).toBe(0);
    expect(doc.getElementById("consequence-region").children.length).toBe(0);
    const footer = doc.getElementById("footer-region");
    expect(footer.children.length).toBe(1);
    expect(doc.getElementById("notice-fix").textContent).toBe("Try again");
  });

  it("re-runs the check from Try again", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: false } },
    });
    const doc = await open(chromeMock);
    const before = chromeMock.runtime.sendMessage.mock.calls.length;

    doc.getElementById("notice-fix").click();
    await flushAsync();
    await flushAsync();

    expect(chromeMock.runtime.sendMessage.mock.calls.length).toBe(before + 1);
  });

  it("dates the outage once an earlier open already recorded it", async () => {
    const doc = await open(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: false } },
        health: { brokenSince: BROKEN_AT_MS },
      })
    );

    expect(doc.getElementById("status-text").textContent).toBe(
      "Tanita is not answering, so you cannot use it in Kaiord right now."
    );
    expect(doc.getElementById("status-sub").textContent).toBe("Since 23 Apr.");
    // A state that needs the user is a shape, not a colour: the palette has
    // no warning hue to promote the dot with.
    const mark = doc.querySelector("[data-status-mark]");
    expect(mark.tagName.toLowerCase()).toBe("svg");
    expect(mark.querySelector("use").getAttribute("href")).toBe("#i-attn");
  });

  it("does not date an outage it has only just noticed", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: false } },
    });

    const doc = await open(chromeMock);

    // "Since today" is a vacuous date, so the first observation renders the
    // dateless notice...
    expect(doc.getElementById("status-sub").hidden).toBe(true);
    expect(doc.querySelector("[data-status-mark]").tagName.toLowerCase()).toBe(
      "span"
    );
    // ...while still stamping the record, so the NEXT open can date it.
    expect(chromeMock.__store.bridgeHealth.brokenSince).toBe(MOCK_NOW_MS);
  });

  it("keeps the first failure's stamp rather than resetting it every open", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: false } },
      health: { brokenSince: BROKEN_AT_MS },
    });

    await open(chromeMock);

    expect(chromeMock.__store.bridgeHealth.brokenSince).toBe(BROKEN_AT_MS);
  });

  it("clears the outage when the session works again", async () => {
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
    // Any region left without a placeholder is a region that pops into
    // existence when the probe settles — the reflow the skeleton exists to
    // prevent.
    for (const region of [
      "chips-region",
      "consequence-region",
      "footer-region",
    ]) {
      expect(
        doc.querySelectorAll(`#${region} .skeleton`).length
      ).toBeGreaterThan(0);
    }
    expect(doc.querySelectorAll(".skeleton--chip").length).toBe(3);
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

  it("never says signed out when the background answers with an error", async () => {
    const doc = await open(
      buildChromeMock({ sessionResponse: { ok: false, error: "boom" } })
    );

    expect(doc.getElementById("status-text").textContent).toBe(
      "Tanita is not answering, so you cannot use it in Kaiord right now."
    );
    expect(doc.getElementById("notice-fix").textContent).toBe("Try again");
  });

  it("still renders when chrome.storage is unavailable", async () => {
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: false } },
    });
    delete chromeMock.storage;

    const doc = await open(chromeMock);

    // Storage is best-effort: losing it costs the date, not the popup.
    expect(doc.getElementById("status-text").textContent).toBe(
      "Tanita is not answering, so you cannot use it in Kaiord right now."
    );
    expect(doc.getElementById("notice-fix").textContent).toBe("Try again");
  });

  it("should ask the extension to check the session each time the popup opens and on Refresh", async () => {
    // Arrange
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: true } },
    });

    // Act
    const doc = await open(chromeMock);
    const onOpen = chromeMock.runtime.sendMessage.mock.calls.length;
    doc.getElementById("refresh-btn").click();
    await flushAsync();
    await flushAsync();
    const messages = chromeMock.runtime.sendMessage.mock.calls.map(
      ([message]) => message
    );

    // Assert
    expect(onOpen).toBeGreaterThan(0);
    expect(messages).toHaveLength(onOpen + 1);
    expect(messages.filter((m) => m.action !== "checkSession")).toEqual([]);
  });

  it("should record only when the export was last reachable and unreachable", async () => {
    // Arrange
    const chromeMock = buildChromeMock({
      sessionResponse: { ok: true, data: { authenticated: true } },
    });

    // Act
    await open(chromeMock);

    // Assert
    expect(chromeMock.__store).toEqual({
      bridgeHealth: { lastOkAt: MOCK_NOW_MS },
    });
  });

  it("carries no provider hue in its markup", () => {
    // The five brand-coloured header dots were the last item of the V2
    // repaint inventory; the monogram replaced them.
    expect(POPUP_HTML).not.toContain("--accent");
    expect(POPUP_HTML).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(POPUP_HTML).toContain(">Ta</span");
  });
});
