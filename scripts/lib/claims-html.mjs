// The units of text a reader sees on an HTML page, in document order: each
// run of text between tags (a text node), each text alternative a screen
// reader announces or a field shows (aria-label, aria-description, alt,
// title, placeholder) and each text a search result or a link preview shows
// (the description, keywords, og:* and twitter:* text metas). Scripts,
// styles and comments are not shown and are dropped; the JSON-LD a search
// engine shows is read by claims-jsonld.mjs. A unit
// must hold a letter or a digit, so a lone "·" is not a claim but a lone "5"
// is. Pure string scanning: the guard takes no HTML library.

import { decodeEntities, normalize } from "./claims-text.mjs";

const TAG = /(<(?:[^>"']|"[^"]*"|'[^']*')*>)/g;
const ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const HIDDEN_BLOCKS = [
  /<!--[\s\S]*?-->/g,
  /<script\b[\s\S]*?<\/script\s*>/gi,
  /<style\b[\s\S]*?<\/style\s*>/gi,
];

const TEXT_ALTERNATIVES = [
  "aria-label",
  "aria-description",
  "alt",
  "title",
  "placeholder",
];
const SHOWN_METAS = new Set([
  "description",
  "keywords",
  "og:title",
  "og:description",
  "og:image:alt",
  "twitter:title",
  "twitter:description",
  "twitter:image:alt",
]);

const attributesOf = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(ATTRIBUTE)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3]])
  );

const tagTexts = (tag) => {
  const attributes = attributesOf(tag);
  const texts = TEXT_ALTERNATIVES.map((name) => attributes[name]);
  if (/^<meta\b/i.test(tag)) {
    const kind = attributes.name ?? attributes.property;
    if (SHOWN_METAS.has(kind)) texts.push(attributes.content);
  }
  return texts.filter((text) => text !== undefined);
};

const SHOWS_SOMETHING = /[\p{L}\p{N}]/u;

// A code example is one claim (that it runs), not a scatter of tokens.
const PRE = /(<pre\b[\s\S]*?<\/pre\s*>)/gi;

const texts = (html) =>
  html
    .split(TAG)
    .flatMap((part) => (part.startsWith("<") ? tagTexts(part) : [part]));

export const htmlUnits = (src) => {
  const shown = HIDDEN_BLOCKS.reduce(
    (html, block) => html.replace(block, " "),
    src
  );
  return shown
    .split(PRE)
    .flatMap((part) =>
      /^<pre\b/i.test(part) ? [part.replace(TAG, "")] : texts(part)
    )
    .map((text) => normalize(decodeEntities(text)))
    .filter((text) => SHOWS_SOMETHING.test(text));
};
