// The units of text a reader sees on a registered surface. Every unit is a
// claim and must match a register entry word for word (after whitespace is
// collapsed), so nothing visible on the surface can escape the register.
//
// Markdown: a heading, a list item (with its indented continuation lines),
// a table row, or a paragraph (a `>` quote marker is not text); one that
// holds HTML tags is read as HTML.
// YAML front matter, HTML comments and `<script>` / `<style>` blocks are not
// shown to a reader and are dropped. JSON: see claims-json.mjs.

import { htmlUnits } from "./claims-html.mjs";
import { jsonUnits } from "./claims-json.mjs";
import { jsonLdUnits } from "./claims-jsonld.mjs";
import { normalize } from "./claims-text.mjs";

const LIST_ITEM = /^\s*(?:[-*+•]|\d+[.)])\s+/;
const HEADING = /^#{1,6}\s+/;
const TABLE_SEPARATOR = /^\|[\s:|-]+\|$/;

const HIDDEN = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>/gi;
const HAS_TAG = /<\/?[a-z][^>]*>/i;
const withoutHidden = (src) => src.replace(HIDDEN, "");

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
    const text = normalize(current ?? "");
    if (text) units.push(...(HAS_TAG.test(text) ? htmlUnits(text) : [text]));
    current = null;
  };
  for (const line of lines) {
    const trimmed = line.trim().replace(/^>\s?/, "");
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
  if (surface.file.endsWith(".html")) {
    const ld = jsonLdUnits(src);
    if (ld.error) return { error: `${surface.file}: ${ld.error}` };
    return { units: [...htmlUnits(src), ...ld.units] };
  }
  if (surface.keys || surface.file.endsWith(".json"))
    return jsonUnits(surface, src);
  const lines = withoutHidden(withoutFrontMatter(src)).split("\n");
  if (!surface.sections && !surface.intro)
    return { units: markdownUnits(lines) };
  // The intro is the H1 and its lead: everything before the first sub-heading.
  const firstSub = lines.findIndex((line) => headingLevel(line) > 1);
  const units = surface.intro
    ? markdownUnits(firstSub === -1 ? lines : lines.slice(0, firstSub))
    : [];
  for (const title of surface.sections ?? []) {
    const section = sectionLines(lines, title);
    if (section === null)
      return { error: `${surface.file}: section "${title}" is missing` };
    units.push(...markdownUnits(section));
  }
  return { units };
};
