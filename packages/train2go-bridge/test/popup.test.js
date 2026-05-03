import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = dirname(HERE);
const POPUP_HTML = readFileSync(join(PKG, "popup.html"), "utf8");
const POPUP_JS = readFileSync(join(PKG, "popup.js"), "utf8");

const setupDom = (chromeMock) => {
  const dom = new JSDOM(POPUP_HTML, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "chrome-extension://fake/popup.html",
  });
  dom.window.chrome = chromeMock;
  dom.window.eval(POPUP_JS);
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

const FRESH_NOW = new Date("2026-05-02T10:00:00Z").getTime();

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
    expect(status.className).toContain("status--ok");
    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "Connected as Pablo"
    );
    expect(dom.window.document.getElementById("status-sub").textContent).toBe(
      "Coach · Aritz Mardaras"
    );
    const rollup =
      dom.window.document.getElementById("rollup-region").textContent;
    expect(rollup).toContain("3 sessions planned");
    expect(rollup).toContain("2 done");
    expect(rollup).toContain("workload 287");
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
    expect(status.className).toContain("status--no");
    expect(dom.window.document.getElementById("retry-btn")).not.toBeNull();
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
        .className.includes("status--ok")
    ).toBe(true);
    expect(
      dom.window.document.getElementById("rollup-region").textContent
    ).toContain("Rollup unavailable");
    expect(dom.window.document.getElementById("retry-btn")).toBeNull();
  });
});
