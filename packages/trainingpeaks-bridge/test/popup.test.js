import { describe, expect, it, vi } from "vitest";
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
  dom.window.Date.now = () => MOCK_NOW_MS;
  // Concatenated into ONE eval: real <script> tags share the page's global
  // lexical scope, but separate indirect evals do not.
  dom.window.eval(POPUP_SCRIPTS.join("\n;\n"));
  return dom;
};

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

const buildChromeMock = ({ sessionResponse } = {}) => ({
  runtime: {
    sendMessage: vi.fn((msg, cb) => {
      if (msg.action === "checkSession") cb(sessionResponse);
      else cb({ ok: false, error: "unknown" });
    }),
  },
});

describe("TrainingPeaks popup", () => {
  it("renders connected state with feed chips and the editor as primary CTA", async () => {
    const dom = setupDom(
      buildChromeMock({
        sessionResponse: {
          ok: true,
          data: { authenticated: true, athleteId: 1234 },
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

  it("renders not-signed-in state with the value prop and sign-in as primary CTA", async () => {
    const dom = setupDom(
      buildChromeMock({
        sessionResponse: { ok: true, data: { authenticated: false } },
      })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
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
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Sign in to TrainingPeaks"
    );
    expect(doc.querySelector(".cta-secondary").textContent).toBe(
      "Open Kaiord editor"
    );
  });

  it("renders the checking skeleton before the probe resolves", () => {
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
    expect(doc.querySelectorAll(".skeleton--chip").length).toBe(3);
    expect(doc.querySelectorAll(".skeleton--cta").length).toBe(1);
  });

  it("falls back to not-signed-in when the background answers with an error", async () => {
    const dom = setupDom(
      buildChromeMock({ sessionResponse: { ok: false, error: "boom" } })
    );

    dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    await flushAsync();
    await flushAsync();

    const doc = dom.window.document;
    expect(doc.getElementById("status-text").textContent).toBe("Not signed in");
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Sign in to TrainingPeaks"
    );
  });
});
