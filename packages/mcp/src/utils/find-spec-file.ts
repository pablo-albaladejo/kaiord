import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const DOCS_URL =
  "https://github.com/pablo-albaladejo/kaiord/blob/main/docs/krd-format.md";

export const findSpecFile = (baseDir: string): string => {
  const candidates = [
    resolve(process.cwd(), "docs/krd-format.md"),
    resolve(process.cwd(), "packages/mcp/docs/krd-format.md"),
    resolve(baseDir, "../../../docs/krd-format.md"),
    resolve(baseDir, "../../../../docs/krd-format.md"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  }
  return `KRD format specification not found locally. See: ${DOCS_URL}`;
};
