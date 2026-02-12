import type { TokenData, TokenStore } from "@kaiord/core";

export const createMemoryTokenStore = (): TokenStore => {
  let stored: TokenData | null = null;

  return {
    save: async (tokens: TokenData) => {
      stored = tokens;
    },
    load: async () => stored,
    clear: async () => {
      stored = null;
    },
  };
};
