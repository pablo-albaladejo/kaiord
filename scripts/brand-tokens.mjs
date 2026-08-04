// Resolves a role token from styles/brand-tokens.css into an sRGB hex
// literal, for the Node-side surfaces that cannot run a browser: the
// VitePress `<meta name="theme-color">` tag, the Open Graph card renderer,
// and the bridge-popup palette parity guard.
//
// Two indirections have to be undone. Roles are declared as `var()`
// references into layer-1 ramps, and the ramps are written in oklch, which
// neither an HTML meta tag nor librsvg reads reliably.
//
// Tokens resolve AS UNDER `.dark`: the identity these consumers carry is the
// dark palette. Themed roles live in the `.dark { … }` block, theme-invariant
// ones only on `:root`, so the dark block is searched first with the whole
// file as fallback.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const BRAND_TOKENS_PATH = resolve(
  __dirname,
  "..",
  "styles",
  "brand-tokens.css"
);

// A cycle in the token file is a bug in the token file; the resolver must
// report it, not hang on it.
const MAX_HOPS = 8;

const escapeForRegExp = (name) => name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

function matchToken(source, name) {
  const pattern = new RegExp(
    `${escapeForRegExp(name)}\\s*:\\s*([^;]+?)\\s*(?:;|\\n)`
  );
  return source.match(pattern)?.[1].trim();
}

// Anchor `.dark` to the start of a line so the real rule block is matched and
// not a `.dark { … }` mentioned in the header comment, which would capture an
// ellipsis and fall silently back to the light values.
function extractDarkBlock(source) {
  return source.match(/^\.dark\s*\{([^}]*)\}/m)?.[1] ?? "";
}

/** oklch(L C H) → sRGB hex, via Oklab and linear-light sRGB, clamped to gamut. */
export function oklchToHex(lightness, chroma, hueDegrees) {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const cubes = [
    (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (lightness - 0.089484178 * a - 1.291485548 * b) ** 3,
  ];
  const matrix = [
    [4.0767416621, -3.3077115913, 0.2309699292],
    [-1.2684380046, 2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147, 1.707614701],
  ];
  const gamma = (u) =>
    u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;
  const channels = matrix.map((row) =>
    Math.round(
      Math.min(
        1,
        Math.max(0, gamma(row.reduce((sum, k, i) => sum + k * cubes[i], 0)))
      ) * 255
    )
  );
  return `#${channels.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function toHex(value) {
  const oklch = value.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i
  );
  if (!oklch) return value;
  const lightness = oklch[1].endsWith("%")
    ? Number.parseFloat(oklch[1]) / 100
    : Number.parseFloat(oklch[1]);
  return oklchToHex(
    lightness,
    Number.parseFloat(oklch[2]),
    Number.parseFloat(oklch[3])
  );
}

/**
 * @param {string} name a `--custom-property`
 * @param {string} [tokensPath] override, for tests
 * @param {"dark"|"light"} [theme] which role block to read first
 */
export function readBrandTokenColor(
  name,
  tokensPath = BRAND_TOKENS_PATH,
  theme = "dark"
) {
  if (!name.startsWith("--")) {
    throw new Error(
      `readBrandTokenColor: token name must start with "--"; got ${name}`
    );
  }
  const file = readFileSync(tokensPath, "utf8");
  const darkBlock = extractDarkBlock(file);
  // For the light theme the dark block is not a fallback, it is the wrong
  // answer: drop it so `:root` is all that remains to match against.
  const source = theme === "light" ? file.replace(darkBlock, "") : file;
  const preferred = theme === "light" ? "" : darkBlock;

  let token = name;
  for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
    const value = matchToken(preferred, token) ?? matchToken(source, token);
    if (!value) {
      throw new Error(
        `readBrandTokenColor: token ${token} not found in ${tokensPath}`
      );
    }
    const reference = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (!reference) return toHex(value);
    token = reference[1];
  }
  throw new Error(
    `readBrandTokenColor: ${name} did not resolve within ${MAX_HOPS} references — the token file has a var() cycle`
  );
}
