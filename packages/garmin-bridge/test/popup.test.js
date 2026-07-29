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
    expect(status.className).toContain("status-block--ok");
    expect(dom.window.document.getElementById("status-text").textContent).toBe(
      "Connected"
    );
    const chips = dom.window.document.getElementById("chips-region");
    expect(chips.textContent).toContain("Feeds Kaiord");
    expect(chips.textContent).toContain("Activity");
    expect(chips.querySelectorAll(".chip--out").length).toBe(2);
    expect(chips.querySelectorAll(".chip--muted").length).toBe(0);
    expect(dom.window.document.querySelector(".cta-primary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(
      dom.window.document.querySelector(".cta-secondary").textContent
    ).toBe("Open Garmin Connect ↗");
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

  // Reachable falsehood the old copy shipped: sign out of Garmin Connect and
  // the current bearer is still valid, so `gcApi.ok` stays true and the popup
  // went on claiming it was "riding your Garmin Connect session" — a session
  // that no longer existed.
  it("does not claim a live Garmin session while connected", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: {
          ok: true,
          data: { gcApi: { ok: true, totalCount: 4 } },
        },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe("Connected");
    const cause = doc.getElementById("status-sub").textContent;
    expect(cause).toContain("minted from an earlier sign-in");
    // Concept, not string: `not.toContain("session")` is case-sensitive, so a
    // sentence-initial "Session" — the likeliest way the claim comes back —
    // would have walked straight through it.
    expect(cause).not.toMatch(/session/i);
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
    expect(status.className).toContain("status-block--warn");
    const retry = dom.window.document.getElementById("retry-btn");
    expect(retry).not.toBeNull();
    expect(retry.textContent).toBe("Retry");
  });

  it("makes signing back in the primary CTA and mutes the chips when there is no access", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: false } } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe(
      "No access to Garmin Connect"
    );
    // The cause must not diagnose. A failed check is not evidence the user is
    // signed out, because a failure can always be Garmin being unavailable —
    // which is true however the token refresh turns out to authenticate (see
    // #1102). The old copy told a signed-in user that their "tab is signed
    // out". Both possibilities, neither asserted.
    const cause = doc.getElementById("status-sub").textContent;
    expect(cause).toContain("could not read from Garmin Connect");
    expect(cause).toContain("if you are already signed in");
    // The assertion this whole branch rests on, so it pins the CONCEPT: the
    // previous form was `not.toContain("signed out,")` — with the comma — and
    // passed happily on "You are signed out." or "signed out and…". A guard
    // that excludes one punctuation variant of the regression is not guarding
    // the regression.
    expect(cause).not.toMatch(/signed out/i);
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Sign in to Garmin Connect"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open Kaiord editor"
    );
    expect(
      doc.getElementById("chips-region").querySelectorAll(".chip--muted").length
    ).toBe(3);
  });

  it("does not accumulate a retry button or CTA set across failure cycles", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: false } } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();
    const doc = dom.window.document;
    doc.getElementById("retry-btn").click();
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
    // Focus follows the control the user just activated, not a stale node.
    expect(doc.activeElement.id).toBe("retry-btn");
  });

  it("keeps focus on the header refresh button when the reload starts there", async () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: false } } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();
    const doc = dom.window.document;
    const refreshBtn = doc.getElementById("refresh-btn");
    refreshBtn.focus();
    refreshBtn.click();
    await flushAsync();
    await flushAsync();

    expect(doc.activeElement.id).toBe("refresh-btn");
    expect(doc.querySelectorAll("#retry-btn").length).toBe(1);
  });

  it("renders the checking skeleton before the probe resolves", () => {
    const dom = setupDom(
      buildChromeMock({
        pingResponse: { ok: true, data: { gcApi: { ok: true } } },
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
