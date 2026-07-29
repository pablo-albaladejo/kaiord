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

// The popup asks TWO questions, and the second one decides between the
// connected and no-tab states. `tabOpen` defaults to true so the pre-existing
// cases keep meaning what they meant; the no-tab case sets it false.
const buildChromeMock = ({ statusResponse, tabOpen = true } = {}) => ({
  runtime: {
    sendMessage: vi.fn((msg, cb) => {
      if (msg.action === "status") cb(statusResponse);
      else if (msg.action === "tab-open")
        cb({ ok: true, data: { open: tabOpen } });
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
    expect(doc.getElementById("consequence-region").textContent).toContain(
      "Close every app.whoop.com tab and reads stop"
    );
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
    const consequence = doc.getElementById("consequence-region").textContent;
    expect(consequence).toContain(
      "Everything already imported stays in Kaiord"
    );
    expect(consequence).toContain("Sign in at app.whoop.com");
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
    expect(doc.getElementById("status").className).toContain(
      "status-block--warn"
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
          if (msg.action === "status") {
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
  it("reports signed out, not no-tab, when the bearer and the tab are both gone", async () => {
    const dom = setupDom(
      buildChromeMock({
        statusResponse: { ok: true, data: { connected: false } },
        tabOpen: false,
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "Session signed out"
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
