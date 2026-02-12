import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const DOCS_URL =
  "https://github.com/pablo-albaladejo/kaiord/blob/main/docs/krd-format.md";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const findSpecFile = (): string => {
  const candidates = [
    resolve(process.cwd(), "docs/krd-format.md"),
    resolve(process.cwd(), "packages/mcp/docs/krd-format.md"),
    resolve(__dirname, "../../../docs/krd-format.md"),
    resolve(__dirname, "../../../../docs/krd-format.md"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  }
  return `KRD format specification not found locally. See: ${DOCS_URL}`;
};
