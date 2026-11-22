// The units of text a reader sees on a registered surface. Every unit is a
// claim and must match a register entry word for word (after whitespace is
// collapsed), so nothing visible on the surface can escape the register.
//
// Markdown: a heading, a list item (with its indented continuation lines),
// a table row, or a paragraph. YAML front matter and HTML comments are not
// shown to a reader and are dropped. JSON: the `message` of each named key,
// the shape of a Chrome `_locales/*/messages.json`.

import { htmlUnits } from "./claims-html.mjs";
import { jsonUnits } from "./claims-json.mjs";

const LIST_ITEM = /^\s*(?:[-*+•]|\d+[.)])\s+/;
const HEADING = /^#{1,6}\s+/;
const TABLE_SEPARATOR = /^\|[\s:|-]+\|$/;

export const normalize = (text) => text.replace(/\s+/g, " ").trim();

const withoutComments = (src) => src.replace(/<!--[\s\S]*?-->/g, "");

const withoutFrontMatter = (src) =>
  src.startsWith("---\n") ? src.replace(/^---\n[\s\S]*?\n---\n/, "") : src;

const headingLevel = (line) => /^(#{1,6})\s/.exec(line)?.[1].length ?? 0;

// The lines of one section: from the heading whose text is exactly `title`
// to the next heading of the same or a higher level. null when absent, so a
// renamed heading fails loudly instead of registering an empty surface.
export const sectionLines = (lines, title) => {
  const start = lines.findIndex(
    (line) =>
      headingLevel(line) > 0 && normalize(line.replace(HEADING, "")) === title
  );
  if (start === -1) return null;
  const level = headingLevel(lines[start]);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => {
    const l = headingLevel(line);
    return l > 0 && l <= level;
  });
  return end === -1 ? rest : rest.slice(0, end);
};

export const markdownUnits = (lines) => {
  const units = [];
  let current = null;
  const flush = () => {
    if (current !== null && normalize(current)) units.push(normalize(current));
    current = null;
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || TABLE_SEPARATOR.test(trimmed)) {
      flush();
    } else if (HEADING.test(trimmed) || trimmed.startsWith("|")) {
      flush();
      units.push(normalize(trimmed.replace(HEADING, "")));
    } else if (LIST_ITEM.test(line)) {
      flush();
      current = line.replace(LIST_ITEM, "");
    } else {
      current = current === null ? trimmed : `${current} ${trimmed}`;
    }
  }
  flush();
  return units;
};

// Units of one surface, or an error string when the surface cannot be read.
export const surfaceUnits = (surface, src) => {
  if (surface.file.endsWith(".html")) return { units: htmlUnits(src) };
  if (surface.keys || surface.file.endsWith(".json"))
    return jsonUnits(surface, src);
  const lines = withoutComments(withoutFrontMatter(src)).split("\n");
  if (!surface.sections) return { units: markdownUnits(lines) };
  const units = [];
  for (const title of surface.sections) {
    const section = sectionLines(lines, title);
    if (section === null)
      return { error: `${surface.file}: section "${title}" is missing` };
    units.push(...markdownUnits(section));
  }
  return { units };
};
