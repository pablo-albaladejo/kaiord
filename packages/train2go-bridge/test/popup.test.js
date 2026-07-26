import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = dirname(HERE);
const POPUP_HTML = readFileSync(join(PKG, "popup.html"), "utf8");
// Mirror popup.html script order: the vendored utils and snapshot modules
// load before the site popup.js and share the page's global scope.
const POPUP_SCRIPTS = [
  "bridge-popup-utils.js",
  "bridge-popup-shell.js",
  "bridge-popup-snapshot.js",
  "popup.js",
].map((file) => readFileSync(join(PKG, file), "utf8"));

const FRESH_NOW = new Date("2026-05-02T10:00:00Z").getTime();

const setupDom = (chromeMock) => {
  const dom = new JSDOM(POPUP_HTML, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "chrome-extension://fake/popup.html",
  });
  dom.window.chrome = chromeMock;
  // popup.js runs inside the JSDOM window via eval, so it resolves Date.now
  // against dom.window.Date — which the outer Node mock never touched. Mock
  // both so the staleness check (Date.now() - snapshot.receivedAt) sees a
  // deterministic "now" relative to the fixture timestamps.
  dom.window.Date.now = () => FRESH_NOW;
  // Concatenated into ONE eval: real <script> tags share the page's global
  // lexical scope, but separate indirect evals do not.
  dom.window.eval(POPUP_SCRIPTS.join("\n;\n"));
  return dom;
};

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

const buildChromeMock = ({
  pingResponse,
  readWeekResponse,
  storage = {},
} = {}) => {
  const store = { ...storage };
  return {
    runtime: {
      sendMessage: vi.fn((msg, cb) => {
        if (msg.action === "ping") cb(pingResponse);
        else if (msg.action === "read-week") cb(readWeekResponse);
        else cb({ ok: false, error: "unknown" });
      }),
    },
    storage: {
      local: {
        get: vi.fn((keys, cb) => {
          const out = {};
          for (const k of keys) out[k] = store[k];
          cb(out);
        }),
        set: vi.fn((obj, cb) => {
          Object.assign(store, obj);
          if (cb) cb();
        }),
      },
    },
    __store: store,
  };
};

describe("Train2Go popup", () => {
  let originalNow;

  beforeEach(() => {
    originalNow = Date.now;
    Date.now = () => FRESH_NOW;
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  it("renders connected state with athlete card and weekly rollup", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: {
            sessionActive: true,
            userName: "Pablo",
            userId: 28035,
            coachName: "Aritz Mardaras",
          },
        },
        readWeekResponse: {
          ok: true,
          data: {
            activities: [
              { status: 1, workload: 100 },
              { status: 0, workload: 80 },
              { status: 1, workload: 107 },
            ],
          },
        },
        storage: {
          profileSnapshot: {
            schemaVersion: 1,
            profile: { name: "Pablo" },
            thresholds: { cycling: { ftp: 270 } },
            heartRate: {},
            generatedAt: "2026-05-02T08:00:00.000Z",
            receivedAt: new Date("2026-05-02T08:00:00Z").getTime(),
          },
        },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();
    await flushAsync();

    const status = dom.window.document.getElementById("status");
    expect(status.className).toContain("status-block--ok");
    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "Connected as Pablo"
    );
    expect(dom.window.document.getElementById("status-sub").textContent).toBe(
      "Coach · Aritz Mardaras"
    );
    const chips = dom.window.document.getElementById("chips-region");
    expect(chips.textContent).toContain("Feeds Kaiord");
    expect(chips.textContent).toContain("Planned Session");
    expect(chips.textContent).toContain("Training Zones");
    expect(chips.querySelectorAll(".chip--muted").length).toBe(0);
    expect(dom.window.document.querySelector(".cta-primary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(
      dom.window.document.querySelector(".cta-secondary").textContent
    ).toBe("Open Train2Go ↗");
    const rollup =
      dom.window.document.getElementById("rollup-region").textContent;
    expect(rollup).toContain("3 sessions planned");
    expect(rollup).toContain("2 done");
    expect(rollup).toContain("workload 287");
    // Completion bar mirrors the same numbers: 2 of 3 done.
    expect(
      dom.window.document.querySelector(".week__bar-fill").style.width
    ).toBe("67%");
    expect(
      dom.window.document
        .getElementById("athlete-region")
        .textContent.includes("FTP")
    ).toBe(true);
  });

  it("renders disconnected state with Retry when session is inactive", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { sessionActive: false } },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();

    const status = dom.window.document.getElementById("status");
    expect(status.className).toContain("status-block--warn");
    expect(dom.window.document.getElementById("retry-btn")).not.toBeNull();
  });

  it("makes logging back in the primary CTA and mutes the chips when the session is inactive", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { sessionActive: false } },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe(
      "Session signed out"
    );
    expect(doc.getElementById("status-sub").textContent).toContain(
      "no new plan is reaching Kaiord"
    );
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Log in to Train2Go"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(
      doc.getElementById("chips-region").querySelectorAll(".chip--muted").length
    ).toBe(2);
  });

  it("does not accumulate a retry button or CTA set across failure cycles", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { sessionActive: false } },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();
    const doc = dom.window.document;
    doc.getElementById("retry-btn").click();
    await flushAsync();
    await flushAsync();
    await flushAsync();

    // The skeleton and CTA renders each clear the footer; losing BOTH
    // clears duplicates controls, and losing only the CTA clear leaves
    // skeleton bars behind — the zero-skeleton assert catches that half.
    expect(doc.querySelectorAll("#retry-btn").length).toBe(1);
    const footer = doc.getElementById("footer-region");
    expect(footer.querySelectorAll(".cta-primary").length).toBe(1);
    expect(footer.querySelectorAll(".cta-secondary").length).toBe(1);
    expect(footer.querySelectorAll(".cta-retry").length).toBe(1);
    expect(footer.querySelectorAll(".skeleton").length).toBe(0);
    expect(doc.activeElement.id).toBe("retry-btn");
  });

  it("renders the checking skeleton before the probe resolves", () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: { sessionActive: true, userName: "P", userId: 1 },
        },
        readWeekResponse: { ok: true, data: { activities: [] } },
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

  it("hides coach sub-line when ping payload omits coachName", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: { sessionActive: true, userName: "P", userId: 1 },
        },
        readWeekResponse: { ok: true, data: { activities: [] } },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();

    const sub = dom.window.document.getElementById("status-sub");
    expect(sub.hidden).toBe(true);
    expect(sub.textContent).toBe("");
  });

  it("renders coach notes inside a collapsible <details> when ping carries notes", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: {
            sessionActive: true,
            userName: "Pablo",
            userId: 28035,
            notes: "Plan: pablo / pwd\n\nGoals\nSub-3 marathon",
          },
        },
        readWeekResponse: { ok: true, data: { activities: [] } },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();

    const region = dom.window.document.getElementById("notes-region");
    const details = region.querySelector("details");
    expect(details).not.toBeNull();
    expect(details.querySelector("summary").textContent).toBe("Coach notes");
    const body = details.querySelector(".notes__body");
    expect(body.textContent).toContain("Sub-3 marathon");
    // Defense in depth: body uses textContent so HTML is never parsed.
    expect(body.querySelector("script")).toBeNull();
  });

  it("does not render notes-region content when ping omits notes", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: { sessionActive: true, userName: "P", userId: 1 },
        },
        readWeekResponse: { ok: true, data: { activities: [] } },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();

    const region = dom.window.document.getElementById("notes-region");
    expect(region.children.length).toBe(0);
  });

  it("uses cached rollup when fresh and skips read-week", async () => {
    const mock = buildChromeMock({
      pingResponse: {
        ok: true,
        data: { sessionActive: true, userName: "P", userId: 1 },
      },
      readWeekResponse: { ok: false, error: "should not be called" },
      storage: {
        lastWeeklyRollup: {
          planned: 3,
          done: 1,
          workload: 200,
          // 30 seconds in the FUTURE so cache is fresh regardless
          // of the JSDOM-side clock vs the Node-side clock.
          cachedAt: Number.MAX_SAFE_INTEGER,
        },
      },
    });
    const dom = setupDom(mock);

    await flushAsync();
    await flushAsync();
    await flushAsync();
    await flushAsync();

    const calls = mock.runtime.sendMessage.mock.calls.map((c) => c[0].action);
    expect(calls).toContain("ping");
    expect(calls).not.toContain("read-week");
    expect(
      dom.window.document.getElementById("rollup-region").textContent
    ).toContain("3 sessions planned · 1 done · workload 200");
  });

  it("falls back to read-week when cache is stale", async () => {
    const mock = buildChromeMock({
      pingResponse: {
        ok: true,
        data: { sessionActive: true, userName: "P", userId: 1 },
      },
      readWeekResponse: {
        ok: true,
        data: { activities: [{ status: 0, workload: 50 }] },
      },
      storage: {
        lastWeeklyRollup: {
          planned: 99,
          done: 99,
          workload: 9999,
          cachedAt: 0, // epoch start — guaranteed stale regardless of clock
        },
      },
    });
    const dom = setupDom(mock);
    await flushAsync();
    await flushAsync();
    await flushAsync();
    await flushAsync();

    await flushAsync();
    await flushAsync();
    await flushAsync();
    await flushAsync();

    const calls = mock.runtime.sendMessage.mock.calls.map((c) => c[0].action);
    expect(calls).toContain("read-week");
    expect(
      dom.window.document.getElementById("rollup-region").textContent
    ).toContain("1 sessions planned");
  });

  it("rollup-only failure preserves connected state", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: { sessionActive: true, userName: "P", userId: 1 },
        },
        readWeekResponse: { ok: false, error: "boom" },
      })
    );

    await flushAsync();
    await flushAsync();
    await flushAsync();
    await flushAsync();

    expect(
      dom.window.document
        .getElementById("status")
        .className.includes("status-block--ok")
    ).toBe(true);
    expect(
      dom.window.document.getElementById("rollup-region").textContent
    ).toContain("Rollup unavailable");
    expect(dom.window.document.getElementById("retry-btn")).toBeNull();
  });
});
