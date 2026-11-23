import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";

// What the popup says when a WHOOP sign-in is held but Kaiord cannot use
// it, worded only by the shared connection-notices.js (the App reads the
// same wording through @kaiord/i18n).

const PKG = dirname(dirname(fileURLToPath(import.meta.url)));
const POPUP_HTML = readFileSync(join(PKG, "popup.html"), "utf8");
const POPUP_SCRIPTS = [
  "bridge-popup-utils.js",
  "bridge-popup-shell.js",
  "connection-notices.js",
  "bridge-popup-health.js",
  "popup.js",
].map((file) => readFileSync(join(PKG, file), "utf8"));
const NOTICES = require("../connection-notices.js");

const open = async ({ status, tabOpen }) => {
  const dom = new JSDOM(POPUP_HTML, {
    runScripts: "outside-only",
    url: "chrome-extension://fake/popup.html",
  });
  const store = {};
  dom.window.chrome = {
    runtime: {
      sendMessage: vi.fn((msg, cb) => {
        if (msg.action === "popup-status") cb({ ok: true, data: status });
        else cb({ ok: true, data: { open: tabOpen } });
      }),
    },
    storage: {
      local: {
        get: vi.fn((keys, cb) => cb({})),
        set: vi.fn((items, cb) => {
          Object.assign(store, items);
          cb?.();
        }),
      },
    },
  };
  dom.window.eval(POPUP_SCRIPTS.join("\n;\n"));
  dom.window.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  return dom.window.document;
};

describe("WHOOP popup notices from the shared source", () => {
  it("should not say connected for a WHOOP sign-in with no account id, and offer Sign in to WHOOP", async () => {
    // Arrange
    const expected = NOTICES.noticeForReason("no-account-id", "WHOOP", "en");

    // Act
    const doc = await open({
      status: { connected: true, userId: null, capturedAt: 1 },
      tabOpen: true,
    });

    // Assert
    expect(doc.getElementById("status-text").textContent).toBe(
      expected.message
    );
    expect(expected.message).toContain("import");
    expect(doc.querySelector(".cta-primary").textContent).toBe(
      "Sign in to WHOOP"
    );
    expect(doc.body.textContent).not.toContain("Connected");
  });

  it("should word a held sign-in with no WHOOP tab open as the shared no-tab notice", async () => {
    // Arrange
    const expected = NOTICES.noTabNotice("WHOOP", "en");

    // Act
    const doc = await open({
      status: { connected: true, userId: 42, capturedAt: 1 },
      tabOpen: false,
    });

    // Assert
    expect(doc.getElementById("status-text").textContent).toBe(
      expected.message
    );
    expect(doc.querySelector(".cta-primary").textContent).toBe("Open WHOOP");
  });

  it("should keep the connected display when the sign-in carries an account id and a tab is open", async () => {
    // Arrange
    const status = { connected: true, userId: 42, capturedAt: 1 };

    // Act
    const doc = await open({ status, tabOpen: true });

    // Assert
    expect(doc.getElementById("status-text").textContent).toBe("Connected");
  });
});
