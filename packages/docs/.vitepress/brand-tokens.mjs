// The docs surface reads brand tokens at VitePress config-load time, to wire
// `<meta name="theme-color">` and the OG card from the same source of truth
// as the landing page and the editor.
//
// The resolver itself is repo-wide tooling and lives in scripts/: the popup
// palette guard and the OG card renderer need exactly the same var()-chain
// and oklch handling, and three copies of that would be three chances to
// diverge. This module keeps the VitePress config on a package-local import.

export {
  BRAND_TOKENS_PATH,
  oklchToHex,
  readBrandTokenColor,
} from "../../../scripts/brand-tokens.mjs";
