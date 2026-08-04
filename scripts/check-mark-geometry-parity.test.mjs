// `assets/AGENTS.md` calls the SVG master canonical, but the mark is drawn in
// four places: the asset, the OG card renderer, the SPA's inlined component,
// and the landing header. Three of them have to be hand-written — an SVG
// behind <img src> inherits neither currentColor nor --core-live, and the repo
// has no ?react plugin to inline one — so the copies are real and this guard
// is what makes "canonical" true. Change the master, run this, fix what breaks.

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { buildOgCardSvg } from "./brand-og-card.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(REPO, rel), "utf8");

const MASTER = "assets/mark.svg";
const GEOMETRY_TS =
  "packages/workout-spa-editor/src/components/atoms/BrandMark/mark-geometry.ts";
const LANDING = "packages/landing/index.html";

const num = (value) => Number.parseFloat(value);

/** The master's geometry, as plain numbers. */
const master = () => {
  const svg = read(MASTER);
  return {
    hull: svg.match(/\sd="([^"]+)"/)[1],
    spokes: [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)].map(
      (m) => [num(m[1]), num(m[2]), num(m[3]), num(m[4])]
    ),
    // The final circle is the core; the six before it are the outer nodes.
    circles: [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((m) => [
      num(m[1]),
      num(m[2]),
      num(m[3]),
    ]),
  };
};

describe("mark geometry parity", () => {
  it("the master has one hull, six spokes, six nodes and a core", () => {
    const { spokes, circles } = master();

    assert.equal(spokes.length, 6);
    assert.equal(circles.length, 7);
  });

  it("the SPA component's geometry table matches the master", () => {
    const { hull, spokes, circles } = master();
    const ts = read(GEOMETRY_TS);

    assert.ok(ts.includes(`"${hull}"`), "MARK_HULL diverged from the master");

    const tsSpokes = [...ts.matchAll(/\[([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\]/g)].map((m) =>
      m.slice(1).map(num)
    );
    assert.deepEqual(tsSpokes, spokes, "MARK_SPOKES diverged from the master");

    const nodes = circles.slice(0, 6).map(([cx, cy]) => [cx, cy]);
    const tsNodes = [...ts.matchAll(/^ {2}\[([\d.]+), ([\d.]+)\],$/gm)].map((m) =>
      m.slice(1).map(num)
    );
    assert.deepEqual(tsNodes, nodes, "MARK_NODES diverged from the master");

    assert.ok(
      ts.includes(`MARK_NODE_RADIUS = ${circles[0][2]}`),
      "MARK_NODE_RADIUS diverged from the master"
    );
    assert.ok(
      ts.includes(`MARK_CORE_RADIUS = ${circles[6][2]}`),
      "MARK_CORE_RADIUS diverged from the master"
    );
  });

  it("the Open Graph card draws the master's geometry", () => {
    const { hull, spokes, circles } = master();
    const card = buildOgCardSvg({ subtitle: "Editor" }).toString("utf8");

    assert.ok(card.includes(`d="${hull}"`), "OG card hull diverged");
    for (const [x1, y1, x2, y2] of spokes) {
      assert.ok(
        card.includes(`x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`),
        `OG card is missing the spoke ${x1},${y1} → ${x2},${y2}`
      );
    }
    for (const [cx, cy, r] of circles) {
      assert.ok(
        card.includes(`cx="${cx}" cy="${cy}" r="${r}"`),
        `OG card is missing the circle at ${cx},${cy}`
      );
    }
  });

  it("the landing header inlines the master's hull and every spoke", () => {
    const { hull, spokes } = master();
    const html = read(LANDING);

    assert.ok(html.includes(hull), "landing hull diverged from the master");
    for (const [x1, y1, x2, y2] of spokes) {
      assert.ok(
        html.includes(`x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`),
        `landing header is missing the spoke ${x1},${y1} → ${x2},${y2}`
      );
    }
  });

  it("the live-core master differs from the plain one only in the core fill", () => {
    const plain = read(MASTER);
    const live = read("assets/mark-core-live.svg");

    assert.equal(
      live.replace('fill="var(--core-live, currentColor)"', 'fill="currentColor"'),
      plain
    );
  });

  it("the favicon and app-icon drop the spokes and nodes below 24px", () => {
    for (const name of ["assets/favicon.svg", "assets/mark-app-icon.svg"]) {
      const svg = read(name);
      assert.equal(svg.match(/<line/g), null, `${name} still draws spokes`);
      assert.equal(svg.match(/<circle/g).length, 1, `${name} draws more than the core`);
      assert.ok(svg.includes(master().hull), `${name} hull diverged from the master`);
    }
  });
});
