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
  "bridge-popup-snapshot.js",
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
  // popup.js runs inside the JSDOM window via `eval`, so it resolves
  // `Date.now` against `dom.window.Date`, not the outer Node `Date`.
  // Mock both so the staleness check (Date.now() - snapshot.receivedAt)
  // sees a deterministic "now" relative to the fixture timestamps.
  dom.window.Date.now = () => MOCK_NOW_MS;
  // Run the script bodies so listeners attach. Concatenated into ONE eval:
  // real <script> tags share the page's global lexical scope (top-level
  // const in an earlier script is visible to later ones), but separate
  // indirect evals do not — each gets its own declarative environment.
  dom.window.eval(POPUP_SCRIPTS.join("\n;\n"));
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
    Date.now = () => MOCK_NOW_MS;
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
