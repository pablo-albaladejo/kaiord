/**
 * Root i18n provider. Exposes the app's react-i18next instance (for `t()`),
 * publishes the active resolved `Locale` through a context that defaults to
 * English outside a provider (so unwrapped component tests stay in `en`), and
 * keeps both in sync with the persisted per-profile locale preference.
 */
import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { I18nextProvider } from "react-i18next";

import { resolveLocale } from "../application/resolve-locale";
import { useActiveProfileLive } from "../hooks/use-active-profile-live";
import { useUserPreferences } from "../hooks/use-user-preferences";
import { appI18n, setActiveLocale } from "./i18n";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Active, resolved UI locale; defaults to English outside a provider. */
export const useActiveLocale = (): Locale => useContext(LocaleContext);

const readNavigatorLanguage = (): string =>
  typeof navigator !== "undefined" ? navigator.language : DEFAULT_LOCALE;

const LocaleSync = ({ children }: { children: ReactNode }) => {
  const active = useActiveProfileLive();
  const prefs = useUserPreferences({
    profileId: active?.id ?? null,
    defaultView: "grid",
  });
  const locale = resolveLocale(prefs?.locale, readNavigatorLanguage());
  // Hold the previous locale until the target's catalog is loaded and live, so
  // the subtree never renders the active locale before its strings exist (it
  // falls back to English meanwhile). Lazy locales load a code-split chunk.
  const [activeLocale, setResolvedLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;
    void setActiveLocale(locale).then(() => {
      if (!cancelled) setResolvedLocale(locale);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={activeLocale}>
      {children}
    </LocaleContext.Provider>
  );
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={appI18n}>
    <LocaleSync>{children}</LocaleSync>
  </I18nextProvider>
);
