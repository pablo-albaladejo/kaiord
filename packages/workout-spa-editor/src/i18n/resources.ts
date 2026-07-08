/**
 * Assembles the SPA i18n resource tree from per-locale, per-namespace JSON.
 * English is the source-of-truth catalog; `es` must maintain key parity
 * (enforced by `resource-parity.test.ts`). Add a namespace by importing its
 * `en`/`es` JSON and listing it in both maps plus `NAMESPACES`.
 */

import type { LocaleResources } from "@kaiord/i18n";

import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enLabImport from "./locales/en/labImport.json";
import enLabs from "./locales/en/labs.json";
import esCommon from "./locales/es/common.json";
import esErrors from "./locales/es/errors.json";
import esLabImport from "./locales/es/labImport.json";
import esLabs from "./locales/es/labs.json";

export const NAMESPACES = ["common", "errors", "labs", "labImport"] as const;

export const DEFAULT_NAMESPACE = "common";

export const resources: LocaleResources = {
  en: {
    common: enCommon,
    errors: enErrors,
    labs: enLabs,
    labImport: enLabImport,
  },
  es: {
    common: esCommon,
    errors: esErrors,
    labs: esLabs,
    labImport: esLabImport,
  },
};
