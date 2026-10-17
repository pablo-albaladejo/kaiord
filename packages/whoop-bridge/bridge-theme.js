/**
 * Kaiord Bridge Core — Popup Theme Preference (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-theme.js. Never edit a vendored
 * copy — edit the master and run `pnpm bridge:sync`.
 *
 * The popup follows the theme the user picked in the Kaiord app. The app
 * sends its PREFERENCE (light | dark | system) as the external `set-theme`
 * action; the sender origin is already pinned by `createExternalDispatch`
 * (bridge-envelope.js), and the value is pinned here to the three literals
 * before it is written to `chrome.storage.local`.
 *
 * Loaded in two contexts:
 *   - background.js (importScripts): `storeThemePreference`.
 *   - popup.html, in <head> so it runs before the body is painted: applies
 *     `data-theme` on <html>. An explicit `light`/`dark` sets the attribute;
 *     `system`, a missing value (the app was never opened), or anything
 *     unrecognised removes it, so popup.css follows `prefers-color-scheme`.
 *
 * `chrome.storage.local` is only readable asynchronously, which could paint
 * one frame in the wrong theme. The popup therefore mirrors the last value
 * it read into its own synchronous `localStorage`, applies the mirror first,
 * and then reconciles with the stored preference.
 */

const KD_THEME_KEY = "kaiordTheme";
const THEME_PREFERENCES = ["light", "dark", "system"];

const isThemePreference = (value) =>
  typeof value === "string" && THEME_PREFERENCES.includes(value);

const storeThemePreference = async (theme) => {
  if (!isThemePreference(theme)) {
    const err = new Error("Invalid theme preference");
    err.retryable = false;
    throw err;
  }
  await chrome.storage.local.set({ [KD_THEME_KEY]: theme });
  return null;
};

const applyThemePreference = (theme, root = document.documentElement) => {
  if (theme === "light" || theme === "dark") {
    root.dataset.theme = theme;
  } else {
    delete root.dataset.theme;
  }
};

// Storage is best-effort: a popup that cannot read or write its mirror still
// renders, in the system theme.
const readThemeMirror = () => {
  try {
    const mirrored = localStorage.getItem(KD_THEME_KEY);
    return isThemePreference(mirrored) ? mirrored : null;
  } catch {
    return null;
  }
};

const writeThemeMirror = (theme) => {
  try {
    localStorage.setItem(KD_THEME_KEY, theme ?? "system");
  } catch {
    // Mirror unavailable; the next open reconciles from chrome.storage.
  }
};

const syncPopupTheme = async (root = document.documentElement) => {
  applyThemePreference(readThemeMirror(), root);
  let stored;
  try {
    stored = (await chrome.storage.local.get(KD_THEME_KEY))?.[KD_THEME_KEY];
  } catch {
    return readThemeMirror();
  }
  const theme = isThemePreference(stored) ? stored : null;
  applyThemePreference(theme, root);
  writeThemeMirror(theme);
  return theme;
};

if (typeof module !== "undefined") {
  module.exports = {
    KD_THEME_KEY,
    THEME_PREFERENCES,
    isThemePreference,
    storeThemePreference,
    applyThemePreference,
    readThemeMirror,
    syncPopupTheme,
  };
} else if (typeof document !== "undefined") {
  void syncPopupTheme();
} else if (typeof self !== "undefined") {
  self.storeThemePreference = storeThemePreference;
}
