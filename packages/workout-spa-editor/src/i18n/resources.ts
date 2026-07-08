/**
 * Assembles the SPA i18n resource tree from per-locale, per-namespace JSON.
 * English is the source-of-truth catalog; `es` must maintain key parity
 * (enforced by `resource-parity.test.ts`). Add a namespace by importing its
 * `en`/`es` JSON and listing it in both maps plus `NAMESPACES`.
 */

import type { LocaleResources } from "@kaiord/i18n";

import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enLabs from "./locales/en/labs.json";
import enNav from "./locales/en/nav.json";
import enSettings from "./locales/en/settings.json";
import esCommon from "./locales/es/common.json";
import esErrors from "./locales/es/errors.json";
import esLabs from "./locales/es/labs.json";
import esNav from "./locales/es/nav.json";
import esSettings from "./locales/es/settings.json";

export const NAMESPACES = [
  "common",
  "errors",
  "labs",
  "nav",
  "settings",
] as const;

export const DEFAULT_NAMESPACE = "common";

export const resources: LocaleResources = {
  en: {
    common: enCommon,
    errors: enErrors,
    labs: enLabs,
    nav: enNav,
    settings: enSettings,
  },
  es: {
    common: esCommon,
    errors: esErrors,
    labs: esLabs,
    nav: esNav,
    settings: esSettings,
  },
};
