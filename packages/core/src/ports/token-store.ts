import type { TokenData } from "./auth-provider";

/**
 * Port for persisting authentication tokens between sessions.
 */
export type TokenStore = {
  save: (tokens: TokenData) => Promise<void>;
  load: () => Promise<TokenData | null>;
  clear: () => Promise<void>;
};
