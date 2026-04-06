import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import type { TokenData, TokenStore } from "@kaiord/core";

const DEFAULT_PATH = join(homedir(), ".kaiord", "garmin-tokens.json");

export const createFileTokenStore = (
  filePath: string = DEFAULT_PATH
): TokenStore => ({
  save: async (tokens: TokenData) => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(tokens, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
  },

  load: async (): Promise<TokenData | null> => {
    try {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content) as TokenData;
    } catch {
      return null;
    }
  },

  clear: async () => {
    try {
      await unlink(filePath);
    } catch {
      // File may not exist
    }
  },
});
