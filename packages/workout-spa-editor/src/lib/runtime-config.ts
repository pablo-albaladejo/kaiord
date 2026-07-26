/**
 * Runtime configuration accessor.
 *
 * Reads environment-specific values from `window.__KAIORD_CONFIG__`, which is
 * populated by an inline `<script>` block in `index.html` whose values are
 * substituted at deploy time (NOT at build time). This keeps the compiled
 * bundle environment-agnostic per 12-factor III (config in env) and V
 * (build / release / run separation).
 *
 * Until the deploy step substitutes the placeholder, the literal placeholder
 * string remains in the field. Treat that as "no value" so dev / preview /
 * unconfigured deploys silently fall back to the no-op analytics adapter.
 */

export const UMAMI_WEBSITE_ID_PLACEHOLDER = "__UMAMI_WEBSITE_ID__";

export type RuntimeConfig = {
  umamiWebsiteId?: string;
};

type WindowWithConfig = Window &
  typeof globalThis & {
    __KAIORD_CONFIG__?: RuntimeConfig;
  };

/**
 * Returns the Umami website id if a real value has been injected at deploy
 * time. Returns `undefined` when the placeholder is still in place, the field
 * is empty, or `window` is unavailable (SSR / tests without DOM).
 */
export const getUmamiWebsiteId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const cfg = (window as WindowWithConfig).__KAIORD_CONFIG__;
  const websiteId = cfg?.umamiWebsiteId;
  if (!websiteId) return undefined;
  if (websiteId === UMAMI_WEBSITE_ID_PLACEHOLDER) return undefined;
  return websiteId;
};
