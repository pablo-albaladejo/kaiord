import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const FALLBACK_URL = "https://github.com/pablo-albaladejo/kaiord";

export const findSchemaFile = (): string => {
  const candidates = [
    resolve(process.cwd(), "packages/core/schema/krd.json"),
    resolve(process.cwd(), "node_modules/@kaiord/core/schema/krd.json"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
  }
  return JSON.stringify({
    error: `KRD schema file not found. See ${FALLBACK_URL}`,
  });
};
