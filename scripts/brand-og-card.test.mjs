// The OG card is the only marketing surface rendered from Node, so it is the
// one place the magenta roles may appear outside packages/landing. These
// tests pin that it reads them from the token file rather than baking a hex,
// and that it draws the current mark.

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildOgCardSvg, OG_HEIGHT, OG_WIDTH } from "./brand-og-card.mjs";
import { readBrandTokenColor } from "./brand-tokens.mjs";

const card = () => buildOgCardSvg({ subtitle: "Editor" }).toString("utf8");

test("renders at the Open Graph aspect the branding spec pins", () => {
  assert.equal(OG_WIDTH, 1200);
  assert.equal(OG_HEIGHT, 630);
  assert.match(card(), /width="1200" height="630"/);
});

test("paints the page and the mark from resolved tokens", () => {
  const svg = card();

  assert.match(svg, new RegExp(`fill="${readBrandTokenColor("--bg-page")}"`));
  assert.match(svg, new RegExp(`fill="${readBrandTokenColor("--mkt-brand")}"`));
  assert.match(svg, new RegExp(`fill="${readBrandTokenColor("--text")}"`));
});

test("carries no colour literal of its own", () => {
  const resolved = new Set(
    ["--bg-page", "--text", "--text-dim", "--mkt-brand"].map((token) =>
      readBrandTokenColor(token)
    )
  );
  const literals = card().match(/#[0-9a-fA-F]{6}/g) ?? [];

  assert.deepEqual(
    literals.filter((hex) => !resolved.has(hex)),
    []
  );
});

test("draws the rebuilt hub, not the retired 40-unit one", () => {
  const svg = card();

  assert.match(
    svg,
    /M16 5L6\.47 10\.5L6\.47 21\.5L16 27L25\.53 21\.5L25\.53 10\.5Z/
  );
  assert.doesNotMatch(svg, /M20 0L37\.32 10/);
});

test("places the subtitle it was given", () => {
  assert.match(
    buildOgCardSvg({ subtitle: "Documentation" }).toString(),
    />Documentation</
  );
});

test("escapes a subtitle that would otherwise break the XML", () => {
  const svg = buildOgCardSvg({
    subtitle: "Strength & Conditioning <beta>",
  }).toString();

  assert.match(svg, />Strength &amp; Conditioning &lt;beta&gt;</);
  // One `<` per real element: an unescaped subtitle would add two more.
  assert.equal(svg.split("<").length, svg.split(/<[/a-z?!]/i).length);
});

test("keeps every weight at 600 or below", () => {
  const weights = [...card().matchAll(/font-weight="(\d+)"/g)].map((m) =>
    Number(m[1])
  );

  assert.ok(weights.length > 0);
  assert.ok(
    weights.every((w) => w <= 600),
    `found ${weights.join(", ")}`
  );
});
