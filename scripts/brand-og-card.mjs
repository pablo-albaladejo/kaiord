// The Open Graph card, defined once. The landing, docs and editor surfaces
// each render it with their own subtitle; before this module the same SVG
// existed twice and drew the pre-rebrand hub inline, so a mark change reached
// the favicon and left the social cards behind.
//
// An OG card is a marketing surface, so it is the one place inside the
// generator tooling where the magenta roles are legitimate.

import { readBrandTokenColor } from "./brand-tokens.mjs";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// packages/_shared/... has its own icon master; this is assets/mark.svg, kept
// in sync by hand because a Node script cannot inline an SVG's children
// without a parser and the geometry is fourteen elements.
const MARK_SCALE = 5; // 32-unit viewBox → 160px
const MARK_X = OG_WIDTH / 2 - (32 * MARK_SCALE) / 2;
const MARK_Y = 96;

const SPOKES = [
  [16, 11.4, 16, 7.6],
  [12.02, 13.7, 8.72, 11.8],
  [12.02, 18.3, 8.72, 20.2],
  [16, 20.6, 16, 24.4],
  [19.98, 18.3, 23.28, 20.2],
  [19.98, 13.7, 23.28, 11.8],
];

const NODES = [
  [16, 5],
  [6.47, 10.5],
  [6.47, 21.5],
  [16, 27],
  [25.53, 21.5],
  [25.53, 10.5],
];

const renderMark = (ink) =>
  [
    `<path d="M16 5L6.47 10.5L6.47 21.5L16 27L25.53 21.5L25.53 10.5Z" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round" fill="none"/>`,
    ...SPOKES.map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="1.4"/>`
    ),
    ...NODES.map(
      ([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.9" fill="${ink}"/>`
    ),
    `<circle cx="16" cy="16" r="4" fill="${ink}"/>`,
  ].join("\n      ");

/**
 * @param {{ subtitle: string }} options
 * @returns {Buffer} the card as an SVG document
 */
export function buildOgCardSvg({ subtitle }) {
  const page = readBrandTokenColor("--bg-page");
  const ink = readBrandTokenColor("--text");
  const dim = readBrandTokenColor("--text-dim");
  const brand = readBrandTokenColor("--mkt-brand");

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="600" cy="205" r="430">
      <stop offset="0%" stop-color="${brand}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${brand}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${page}"/>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)"/>
  <g transform="translate(${MARK_X}, ${MARK_Y}) scale(${MARK_SCALE})">
      ${renderMark(brand)}
  </g>
  <text x="600" y="360" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="600" letter-spacing="-2.7" fill="${ink}">kaiord</text>
  <text x="600" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="500" fill="${brand}">${subtitle}</text>
  <text x="600" y="560" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="${dim}">by Pablo Albaladejo</text>
</svg>`);
}
