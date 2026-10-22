import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Node module hook: a `.md` import is its text as the default export, as the
 * tsdown `loader: { ".md": "text" }` and the vitest `raw-md` plugin do.
 */
export const load = async (url, context, nextLoad) => {
  if (!url.startsWith("file:") || !url.endsWith(".md")) {
    return nextLoad(url, context);
  }
  const text = await readFile(fileURLToPath(url), "utf8");
  return {
    format: "module",
    source: `export default ${JSON.stringify(text)};`,
    shortCircuit: true,
  };
};
