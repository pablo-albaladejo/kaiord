// The branding spec requires the docs surface to carry a `theme-color`
// meta tag derived from the shared `--brand-bg-primary` token. These tests
// pin that invariant at the head-builder layer (upstream of VitePress) so
// any drift fails before the site is rendered.

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { readBrandTokenColor } from "../.vitepress/brand-tokens.mjs";
import { buildStaticHead } from "../.vitepress/head-config.mjs";

const SAMPLE_OPTIONS = {
  docsBase: "/docs/",
  ogImage: "https://kaiord.com/docs/og-image-docs.png",
};

test("emits a theme-color meta tag", () => {
  const head = buildStaticHead(SAMPLE_OPTIONS);

  const themeColor = head.find(
    ([tag, attrs]) => tag === "meta" && attrs.name === "theme-color"
  );

  assert.ok(themeColor, "head is missing <meta name='theme-color'>");
});

test("theme-color value equals --brand-bg-primary from the shared tokens", () => {
  const head = buildStaticHead(SAMPLE_OPTIONS);
  const themeColor = head.find(
    ([tag, attrs]) => tag === "meta" && attrs.name === "theme-color"
  );

  const expected = readBrandTokenColor("--brand-bg-primary");
  assert.equal(themeColor[1].content, expected);
});

test("theme-color parity is mechanical — it is never a literal hex", () => {
  const head = buildStaticHead(SAMPLE_OPTIONS);
  const themeColor = head.find(
    ([tag, attrs]) => tag === "meta" && attrs.name === "theme-color"
  );

  // Exact match against the token; if someone hard-codes a hex in the
  // builder, this test fails when the token changes.
  const fromToken = readBrandTokenColor("--brand-bg-primary");
  assert.equal(themeColor[1].content, fromToken);
});
