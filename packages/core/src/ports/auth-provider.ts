/**
 * Opaque token data for session persistence.
 */
export type TokenData = Record<string, unknown>;

/**
 * Port for authentication against a remote service.
 */
export type AuthProvider = {
  login: (username: string, password: string) => Promise<void>;
  is_authenticated: () => boolean;
  export_tokens: () => Promise<TokenData>;
  restore_tokens: (tokens: TokenData) => Promise<void>;
  logout: () => Promise<void>;
};
