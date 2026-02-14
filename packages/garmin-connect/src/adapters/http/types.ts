export type FetchFn = typeof globalThis.fetch;
export type OAuthConsumer = { key: string; secret: string };

export type OAuth1Token = {
  oauth_token: string;
  oauth_token_secret: string;
};

export type OAuth2Token = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in: number;
  expires_at: number;
};

export type GarminHttpClient = {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, body: unknown) => Promise<T>;
  del: <T>(url: string) => Promise<T>;
  setTokens: (oauth1: OAuth1Token, oauth2: OAuth2Token) => void;
  clearTokens: () => void;
  getOAuth2Token: () => OAuth2Token | undefined;
};
