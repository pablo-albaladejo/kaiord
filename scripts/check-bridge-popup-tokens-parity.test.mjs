import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readBrandTokenColor } from "./brand-tokens.mjs";
import { DEFAULT_MASTERS_DIR } from "./sync-bridge-core.mjs";

// The bridge popups cannot import styles/brand-tokens.css — Chrome extensions
// ship flat, unbundled files — so the popup-shell master re-declares both
// palettes as `--kd-*` literals: the dark one on `:root`, the light one in an
// explicit-preference block and an OS-scheme block. This guard pins each
// literal to the role it was copied from, so a brand-token repaint cannot
// leave the five popups on a stale palette.
//
// The comparison resolves rather than string-matches: a role is a `var()`
// reference into an oklch ramp, and the popup master keeps hex so the file
// still reads as a palette and so this guard's failure message stays legible.
// Only the FIRST `.dark { … }` block is read — brand-tokens.css documents that
// invariant (single flat block) for exactly this class of Node-side reader;
// light values are read from `:root` with that block removed.

// --kd-* token in the popup master → the role it is copied from.
const TOKEN_SOURCES = {
  "--kd-bg-primary": "--bg-page",
  "--kd-bg-surface": "--bg-surface",
  "--kd-bg-elevated": "--bg-elevated",
  "--kd-text-primary": "--text",
  "--kd-text-secondary": "--text-secondary",
  "--kd-text-muted": "--text-dim",
  "--kd-text-disabled": "--text-disabled",
  "--kd-control": "--control",
  "--kd-control-ink": "--control-ink",
  "--kd-control-hover": "--control-hover",
  "--kd-border": "--border",
  "--kd-border-soft": "--border-subtle",
  // The shell's only hue: zone 4 edges the card that names a real training
  // session.
  "--kd-zone-4": "--zone-4",
};

// Light-only departures from TOKEN_SOURCES. The brand's light `--text-dim`
// is 4.36:1 on `--bg-page` and 4.10:1 on `--bg-elevated`, under WCAG AA's
// 4.5:1 for the 12px captions, causes and meta lines the popup sets in
// `--kd-text-muted`; each muted step therefore reads one role darker.
const LIGHT_SOURCE_OVERRIDES = {
  "--kd-text-muted": "--text-secondary",
  "--kd-text-disabled": "--text-dim",
};

const LIGHT_BLOCKS = [
  ':root[data-theme="light"]',
  ':root:not([data-theme="dark"])',
];

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
// A token block holds no nested rule, so the first `}` after the opener ends
// it; the leading indent admits the light block nested in its media query.
const readRuleBlock = (src, selector, file) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const opener = new RegExp(`^ *${escaped} \\{$`, "m");
  const match = opener.exec(src);
  assert.ok(match, `${file}: no ${selector} { … } block found`);
  const start = match.index;
  const end = src.indexOf("}", start + match[0].length);
  assert.ok(end > start, `${file}: unterminated ${selector} block`);
  return src.slice(start, end);
};

const readPopupTokens = (selector = ":root") => {
  const src = readFileSync(join(DEFAULT_MASTERS_DIR, "popup.css"), "utf8");
  const block = readRuleBlock(src, selector, "popup.css master");
  return readDeclarations(block, "--kd-");
};

describe("bridge popup token parity", () => {
  it("every --kd-* literal equals its role's resolved dark value", () => {
    const popup = readPopupTokens();
    for (const [kdToken, role] of Object.entries(TOKEN_SOURCES)) {
      assert.ok(
        popup[kdToken],
        `popup.css master does not declare ${kdToken} as a hex literal`
      );
      const resolved = readBrandTokenColor(role).toLowerCase();
      assert.equal(
        popup[kdToken],
        resolved,
        `${kdToken} is ${popup[kdToken]} but ${role} resolves to ${resolved} — re-copy the dark palette into the popup master`
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

  for (const selector of LIGHT_BLOCKS) {
    it(`every --kd-* literal in ${selector} equals its role's resolved light value`, () => {
      const popup = readPopupTokens(selector);
      assert.deepEqual(
        Object.keys(popup).sort(),
        Object.keys(TOKEN_SOURCES).sort(),
        `${selector} must redeclare exactly the tokens :root declares`
      );
      for (const kdToken of Object.keys(TOKEN_SOURCES)) {
        const role = LIGHT_SOURCE_OVERRIDES[kdToken] ?? TOKEN_SOURCES[kdToken];
        const resolved = readBrandTokenColor(
          role,
          undefined,
          "light"
        ).toLowerCase();
        assert.equal(
          popup[kdToken],
          resolved,
          `${selector} ${kdToken} is ${popup[kdToken]} but light ${role} resolves to ${resolved} — re-copy the light palette into the popup master`
        );
      }
    });
  }
});
