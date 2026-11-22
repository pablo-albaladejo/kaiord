// The origins the Kaiord App is served from, for the Node-side guards
// (check-bridge-exact-origin, the docs' check-privacy-policy). The bridges
// ship their own copy in `_shared/bridge-core/bridge-envelope.js`;
// app-origins.test.mjs holds the two equal.

export const APP_ORIGIN = "https://kaiord.com";

/** The Vite dev servers, declared by the dev `manifest.json` only. */
export const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

/** The Chrome match pattern for every page of one origin. */
export const matchPattern = (origin) => `${origin}/*`;
