// The units of text a reader sees on an HTML page, in document order: each
// run of text between tags (a text node), each text alternative a screen
// reader announces (aria-label, alt, title) and each description a search
// result or a link preview shows (the description, og:* and twitter:* text
// metas). Scripts, styles and comments are not shown and are dropped. A unit
// must hold a letter or a digit, so a lone "·" is not a claim but a lone "5"
// is. Pure string scanning: the guard takes no HTML library.

const normalize = (text) => text.replace(/\s+/g, " ").trim();

const TAG = /(<(?:[^>"']|"[^"]*"|'[^']*')*>)/g;
const ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const HIDDEN_BLOCKS = [
  /<!--[\s\S]*?-->/g,
  /<script\b[\s\S]*?<\/script\s*>/gi,
  /<style\b[\s\S]*?<\/style\s*>/gi,
];

const TEXT_ALTERNATIVES = ["aria-label", "alt", "title"];
const SHOWN_METAS = new Set([
  "description",
  "og:title",
  "og:description",
  "og:image:alt",
  "twitter:title",
  "twitter:description",
  "twitter:image:alt",
]);

const NAMED = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  middot: "·",
  hellip: "…",
  rarr: "→",
  larr: "←",
  times: "×",
  copy: "©",
};

const decode = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] === "#")
      return String.fromCodePoint(
        name[1].toLowerCase() === "x"
          ? parseInt(name.slice(2), 16)
          : Number(name.slice(1))
      );
    return NAMED[name.toLowerCase()] ?? entity;
  });

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
    .map((text) => normalize(decode(text)))
    .filter((text) => SHOWS_SOMETHING.test(text));
};
