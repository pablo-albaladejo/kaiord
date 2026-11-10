// Expands `<!-- @include path/to/partial.html -->` markers in index.html with
// the partial's contents (path relative to the landing root). Shared by the
// Vite build and the i18n string extractor so both see the same document.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const INCLUDE = /([ \t]*)<!--\s*@include\s+(\S+)\s*-->/g;

export const expandIncludes = (html, root) =>
  html.replace(INCLUDE, (_marker, indent, file) =>
    readFileSync(resolve(root, file), "utf8")
      .trimEnd()
      .split("\n")
      .map((line) => (line ? indent + line : line))
      .join("\n")
  );
