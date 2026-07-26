import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MASTERS_DIR } from "./sync-bridge-core.mjs";

// The bridge popups cannot import styles/brand-tokens.css — Chrome extensions
// ship flat, unbundled files — so the popup-shell master re-declares the dark
// palette as `--kd-*` literals. This guard pins each literal to the
// `.dark` block it was copied from, so a brand-token repaint cannot leave the
// five popups on a stale palette.
//
// Only the FIRST `.dark { … }` block is read: brand-tokens.css documents that
// invariant (single flat block) for exactly this class of Node-side reader.

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);

// --kd-* token in the popup master → the brand token it is copied from.
const TOKEN_SOURCES = {
  "--kd-bg-primary": "--brand-bg-primary",
  "--kd-bg-surface": "--brand-bg-surface",
  "--kd-bg-elevated": "--brand-bg-elevated",
  "--kd-text-primary": "--brand-text-primary",
  "--kd-text-secondary": "--brand-text-secondary",
  "--kd-text-muted": "--brand-text-muted",
  "--kd-accent-blue": "--brand-accent-blue",
  "--kd-accent-blue-hover": "--brand-accent-blue-hover",
  "--kd-accent-blue-active": "--brand-accent-blue-active",
  "--kd-accent-blue-soft": "--brand-accent-blue-soft",
  "--kd-semantic-tip": "--brand-semantic-tip",
  "--kd-semantic-warning": "--brand-semantic-warning",
  "--kd-semantic-warning-soft": "--brand-semantic-warning-soft",
  "--kd-border": "--brand-border",
  "--kd-border-soft": "--brand-border-soft",
};

const readDeclarations = (src, prefix) =>
  Object.fromEntries(
    [
      ...src.matchAll(
        new RegExp(`(${prefix}[a-z0-9-]+):\\s*(#[0-9a-fA-F]{3,8})`, "g")
      ),
    ].map((m) => [m[1], m[2].toLowerCase()])
  );

// Anchored at a line start so the prose in each file's header comment (both
// mention the selector by name) cannot be mistaken for the rule itself.
const readRuleBlock = (src, selector, file) => {
  const opener = new RegExp(`^${selector.replace(".", "\\.")} \\{$`, "m");
  const match = opener.exec(src);
  assert.ok(match, `${file}: no ${selector} { … } block found`);
  const start = match.index;
  const end = src.indexOf("\n}", start);
  assert.ok(end > start, `${file}: unterminated ${selector} block`);
  return src.slice(start, end);
};

const readDarkBlock = () => {
  const file = "styles/brand-tokens.css";
  const src = readFileSync(join(REPO, file), "utf8");
  return readDeclarations(readRuleBlock(src, ".dark", file), "--brand-");
};

const readPopupTokens = () => {
  const src = readFileSync(join(DEFAULT_MASTERS_DIR, "popup.css"), "utf8");
  const block = readRuleBlock(src, ":root", "popup.css master");
  return readDeclarations(block, "--kd-");
};

describe("bridge popup token parity", () => {
  it("every --kd-* literal equals its brand-token source", () => {
    const dark = readDarkBlock();
    const popup = readPopupTokens();
    for (const [kdToken, brandToken] of Object.entries(TOKEN_SOURCES)) {
      assert.ok(
        popup[kdToken],
        `popup.css master does not declare ${kdToken} as a hex literal`
      );
      assert.ok(
        dark[brandToken],
        `styles/brand-tokens.css .dark block does not declare ${brandToken}`
      );
      assert.equal(
        popup[kdToken],
        dark[brandToken],
        `${kdToken} is ${popup[kdToken]} but ${brandToken} is ${dark[brandToken]} — re-copy the dark palette into the popup master`
      );
    }
  });

  it("declares a brand-token source for every --kd-* token in the master", () => {
    const popup = readPopupTokens();
    const unmapped = Object.keys(popup).filter((t) => !TOKEN_SOURCES[t]);
    assert.deepEqual(
      unmapped,
      [],
      "add these tokens to TOKEN_SOURCES so they are pinned to brand-tokens.css"
    );
  });
});
