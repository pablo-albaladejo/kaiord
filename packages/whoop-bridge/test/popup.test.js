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

// The popup asks TWO questions, and the second one decides between the
// connected and no-tab states. `tabOpen` defaults to true so the pre-existing
// cases keep meaning what they meant; the no-tab case sets it false.
// `health` seeds chrome.storage.local as a previous popup open would have left
// it; `__store` is readable afterwards so a test can assert what was written.
const buildChromeMock = ({ statusResponse, tabOpen = true, health } = {}) => {
  const store = health ? { bridgeHealth: health } : {};
  return {
    runtime: {
      sendMessage: vi.fn((msg, cb) => {
        if (msg.action === "popup-status") cb(statusResponse);
        else if (msg.action === "tab-open")
          cb({ ok: true, data: { open: tabOpen } });
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
    expect(doc.getElementById("consequence-region").textContent).toContain(
      "Close every app.whoop.com tab and reads stop"
    );
  });

  it("says not checked yet, with no notice and no outage, when no WHOOP sign-in has been captured", async () => {
    const chromeMock = buildChromeMock({
      statusResponse: { ok: true, data: { connected: false } },
      health: { brokenSince: BROKEN_AT_MS },
    });
    const dom = setupDom(chromeMock);

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    // The Kaiord App's Session check answers "not-checked" for the same state,
    // so neither may claim a signed-out session nor offer a fix.
    expect(doc.getElementById("status-text").textContent).toBe(
      "Not checked yet"
    );
    expect(doc.body.textContent).not.toMatch(/signed out|sign in/i);
    expect(doc.getElementById("notice-fix")).toBeNull();
    expect(chromeMock.__store.bridgeHealth).toEqual({
      brokenSince: BROKEN_AT_MS,
    });
  });

  it("does not start an outage when only the tab is missing", async () => {
    const chromeMock = buildChromeMock({
      statusResponse: { ok: true, data: { connected: true } },
      tabOpen: false,
    });
    const dom = setupDom(chromeMock);

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();
    await flushAsync();

    expect(chromeMock.__store.bridgeHealth.brokenSince).toBeUndefined();
    expect(chromeMock.__store.bridgeHealth.lastOkAt).toBe(MOCK_NOW_MS);
  });

  it("clears the outage when the session comes back", async () => {
    const chromeMock = buildChromeMock({
      statusResponse: { ok: true, data: { connected: true } },
      health: { brokenSince: BROKEN_AT_MS },
    });
    const dom = setupDom(chromeMock);

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();
    await flushAsync();

    expect(chromeMock.__store.bridgeHealth.brokenSince).toBeUndefined();
  });

  // The state the popup could not previously express. `connected` is
  // `!!whoopToken` and the token outlives the tab, but whoopFetch throws
  // "No app.whoop.com tab open." — so before this the popup showed a healthy
  // green "Connected · Reading your WHOOP data" over reads that all failed.
  it("renders the no-tab state when the bearer is held but no WHOOP tab is open", async () => {
    const dom = setupDom(
      buildChromeMock({
        statusResponse: { ok: true, data: { connected: true } },
        tabOpen: false,
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    // Muted, not warn: the session is intact and one click restores reads, so
    // this is a paused bridge rather than a broken one. The alert mark is
    // reserved for a state the user has actually lost something to.
    expect(doc.getElementById("status").className).toContain(
      "status-block--muted"
    );
    expect(doc.querySelector("[data-status-mark]").tagName.toLowerCase()).toBe(
      "span"
    );
    expect(doc.getElementById("status-text").textContent).toBe(
      "No WHOOP tab open"
    );
    expect(doc.getElementById("status-sub").textContent).toContain(
      "reads WHOOP from inside an app.whoop.com tab"
    );
    // Fix-first: the thing that ends this state is opening WHOOP.
    expect(doc.querySelector(".cta-primary").textContent).toBe("Open WHOOP ↗");
    const consequence = doc.getElementById("consequence-region").textContent;
    expect(consequence).toContain(
      "Everything already imported stays in Kaiord"
    );
    expect(consequence).toContain("Open app.whoop.com and Kaiord reads");
  });

  // A probe that errors stands for a read that would error too, so the popup
  // must not fall back to the reassuring state.
  it("treats a failed tab probe as no tab rather than as connected", async () => {
    const dom = setupDom({
      runtime: {
        sendMessage: vi.fn((msg, cb) => {
          if (msg.action === "popup-status") {
            cb({ ok: true, data: { connected: true } });
          } else {
            cb({ ok: false, error: "no response" });
          }
        }),
      },
    });

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "No WHOOP tab open"
    );
  });

  // Precedence, tested on the ONLY state that can see it: both signals bad.
  // With a tab open the two orderings are indistinguishable, so `tabOpen:
  // true` here would assert nothing (it survived the swapped-branch mutant).
  // Signing out and closing the tab is the ordinary way to leave WHOOP, and
  // naming the tab there sends the user to do something that fixes nothing.
  it("renders the checking skeleton in every region a resolved state fills", () => {
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
    // The consequence lines are the ones that used to appear out of nowhere
    // when the probe settled.
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
    // chips-region and paused-region are an either/or, so reserving both at
    // once would make the checking state taller than anything that follows.
    expect(doc.getElementById("paused-region").children.length).toBe(0);
  });

  it("still renders when chrome.storage is unavailable", async () => {
    const chromeMock = buildChromeMock({
      statusResponse: { ok: true, data: { connected: true } },
    });
    delete chromeMock.storage;
    const dom = setupDom(chromeMock);

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();
    await flushAsync();

    // Storage is best-effort: losing it costs the date, not the popup.
    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "Connected"
    );
  });

  it("carries no provider hue in its markup", () => {
    // WHOOP's #9333ea was one of the five brand-coloured header dots the V2
    // repaint removed; the monogram replaced them.
    expect(POPUP_HTML).not.toContain("--accent");
    expect(POPUP_HTML).not.toMatch(/#[0-9a-fA-F]{6}/);
    expect(POPUP_HTML).toContain(">Wh</span");
  });

  it("never says signed out when the background answers with an error", async () => {
    const chromeMock = buildChromeMock({
      statusResponse: { ok: false, error: "boom" },
    });
    const dom = setupDom(chromeMock);

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe(
      "WHOOP is not answering, so you cannot use it in Kaiord right now."
    );
    expect(doc.getElementById("notice-fix").textContent).toBe("Try again");
    // A worker that did not answer says nothing about the sign-in.
    expect(chromeMock.__store.bridgeHealth).toBeUndefined();
  });
});
