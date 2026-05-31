/// <reference types="vite/client" />

type ImportMetaEnv = {
  /**
   * Public Google Cloud OAuth Client ID for cross-device sync. Google
   * client IDs are not secrets and are committed in `.env`.
   */
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string;
};

// `ImportMeta` augmentation requires an interface for declaration merging.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
