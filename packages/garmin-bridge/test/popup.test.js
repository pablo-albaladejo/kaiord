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
  // Run the script body so listeners attach.
  dom.window.eval(POPUP_JS);
  return dom;
};

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

const buildChromeMock = ({ pingResponse, storage = {} } = {}) => ({
  runtime: {
    sendMessage: vi.fn((msg, cb) => {
      if (msg.action === "ping") cb(pingResponse);
      else cb({ ok: false, error: "unknown" });
    }),
  },
  storage: {
    local: {
      get: vi.fn((keys, cb) => {
        const out = {};
        for (const k of keys) out[k] = storage[k];
        cb(out);
      }),
    },
  },
});

describe("Garmin popup", () => {
  let originalNow;

  beforeEach(() => {
    originalNow = Date.now;
    Date.now = () => new Date("2026-05-02T10:00:00Z").getTime();
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  it("renders connected state with athlete card and rollup", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: { gcApi: { ok: true, totalCount: 47 } },
        },
        storage: {
          profileSnapshot: {
            schemaVersion: 1,
            profile: { name: "Pablo", bodyWeight: 72 },
            activeSport: "cycling",
            thresholds: { cycling: { ftp: 270 } },
            heartRate: { lthr: 168, max: 188 },
            generatedAt: "2026-05-02T08:00:00.000Z",
            receivedAt: new Date("2026-05-02T08:00:00Z").getTime(),
          },
        },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const status = dom.window.document.getElementById("status");
    expect(status.className).toContain("status--ok");
    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "Connected to Garmin Connect"
    );
    const athleteText =
      dom.window.document.getElementById("athlete-region").textContent;
    expect(athleteText).toContain("FTP");
    expect(athleteText).toContain("270 W");
    expect(athleteText).toContain("LTHR");
    expect(athleteText).toContain("168 bpm");
    const rollupText =
      dom.window.document.getElementById("rollup-region").textContent;
    expect(rollupText).toContain("47 workouts");
    expect(
      dom.window.document
        .getElementById("refresh-btn")
        .className.includes("popup-header__refresh--hidden")
    ).toBe(false);
  });

  it("renders disconnected state with Retry when ping fails", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: false } } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const status = dom.window.document.getElementById("status");
    expect(status.className).toContain("status--no");
    const retry = dom.window.document.getElementById("retry-btn");
    expect(retry).not.toBeNull();
    expect(retry.textContent).toBe("Retry");
  });

  it("renders Last push line in disconnected state when receipt is present", async () => {
    const tenMinAgo = new Date("2026-05-02T09:50:00Z").getTime();
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: false } } },
        storage: { lastPushReceipt: { at: tenMinAgo, name: "Pablo" } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const region = dom.window.document.getElementById("rollup-region");
    expect(region.textContent).toContain("Last push");
    expect(region.textContent).toContain("Pablo");
  });

  it("shows snapshot placeholder when no snapshot exists", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: true } } },
        storage: {},
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const athlete = dom.window.document.getElementById("athlete-region");
    expect(athlete.textContent).toContain(
      "No profile yet. Open Kaiord to set FTP, pace, and HR."
    );
  });

  it("shows stale-snapshot placeholder when snapshot is older than 7 days", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: true } } },
        storage: {
          profileSnapshot: {
            schemaVersion: 1,
            profile: { name: "Pablo" },
            thresholds: {},
            heartRate: {},
            generatedAt: "2026-04-20T00:00:00.000Z",
            receivedAt: new Date("2026-04-20T00:00:00Z").getTime(),
          },
        },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    expect(
      dom.window.document.getElementById("athlete-region").textContent
    ).toContain("Profile snapshot is stale");
  });

  it("shows thresholds-empty placeholder when fresh snapshot has no athlete fields", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: true } } },
        storage: {
          profileSnapshot: {
            schemaVersion: 1,
            profile: { name: "Empty" },
            thresholds: {},
            heartRate: {},
            generatedAt: "2026-05-02T08:00:00.000Z",
            receivedAt: new Date("2026-05-02T08:00:00Z").getTime(),
          },
        },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    expect(
      dom.window.document.getElementById("athlete-region").textContent
    ).toContain("Profile has no thresholds yet");
  });

  it("renders single-cell layout when only one athlete field is present", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: true } } },
        storage: {
          profileSnapshot: {
            schemaVersion: 1,
            profile: { name: "P", bodyWeight: 75 },
            thresholds: {},
            heartRate: {},
            generatedAt: "2026-05-02T08:00:00.000Z",
            receivedAt: new Date("2026-05-02T08:00:00Z").getTime(),
          },
        },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const grid = dom.window.document.querySelector(".athlete");
    expect(grid).not.toBeNull();
    expect(grid.className).toContain("athlete--single");
  });
});
