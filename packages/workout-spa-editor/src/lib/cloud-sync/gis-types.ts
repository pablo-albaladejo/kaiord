/**
 * Google Identity Services (GIS) minimal type surface
 *
 * Only the slice of the GIS OAuth token-client API the Drive adapter
 * uses. Kept local so we depend on no `@types/google.accounts` package
 * and add nothing to the bundle.
 */

export type GisTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GisTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GisTokenResponse) => void;
};

export type GisTokenClient = {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
};

export type GisAccountsOauth2 = {
  initTokenClient: (config: GisTokenClientConfig) => GisTokenClient;
  revoke: (accessToken: string, done?: () => void) => void;
};

export type GisGlobal = {
  google?: {
    accounts?: {
      oauth2?: GisAccountsOauth2;
    };
  };
};
