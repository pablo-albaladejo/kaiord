// The units a search engine can show from a page's JSON-LD
// (`<script type="application/ld+json">`): every string at a key whose text
// is displayed (a name, a description, an answer's text, a headline...).
// Identifiers, URLs, types, dates, prices and categories are data, not
// sentences, and are not units. A block that is not valid JSON fails.

import { normalize } from "./claims-text.mjs";

const BLOCK =
  /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;

export const SHOWN_KEYS = new Set([
  "name",
  "alternateName",
  "description",
  "disambiguatingDescription",
  "text",
  "headline",
  "alternativeHeadline",
  "abstract",
  "caption",
  "keywords",
  "slogan",
  "articleBody",
  "reviewBody",
]);

const shownStrings = (value, key) => {
  if (typeof value === "string") return SHOWN_KEYS.has(key) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap((v) => shownStrings(v, key));
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([k, v]) => shownStrings(v, k));
};

// { units } in document order, or { error } naming the broken block.
export const jsonLdUnits = (src) => {
  const units = [];
  for (const [, body] of src.matchAll(BLOCK)) {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return { error: "a JSON-LD block is not valid JSON" };
    }
    units.push(...shownStrings(data, "").map(normalize).filter(Boolean));
  }
  return { units };
};
