// How the claims guard compares text: whitespace collapsed, ends trimmed, so
// re-wrapping a paragraph or re-indenting markup changes no claim; HTML
// character references decoded to the character a reader sees.

export const normalize = (text) => text.replace(/\s+/g, " ").trim();

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

export const decodeEntities = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] === "#")
      return String.fromCodePoint(
        name[1].toLowerCase() === "x"
          ? parseInt(name.slice(2), 16)
          : Number(name.slice(1))
      );
    return NAMED[name.toLowerCase()] ?? entity;
  });
