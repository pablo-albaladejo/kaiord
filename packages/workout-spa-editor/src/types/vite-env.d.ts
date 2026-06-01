/// <reference types="vite/client" />

// Must be an `interface` so it merges with vite/client's `ImportMetaEnv`
// declaration; redefining it as a `type` breaks env typing.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMetaEnv {
  /**
   * Public Google Cloud OAuth Client ID for cross-device sync. Google
   * client IDs are not secrets and are committed in `.env`.
   */
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID?: string;
}

// `ImportMeta` augmentation requires an interface for declaration merging.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
