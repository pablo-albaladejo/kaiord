import { createTranslator, type LocaleResources } from "@kaiord/i18n";

import enCatalog from "./en.json";
import esCatalog from "./es.json";
import { resolveCliLocale } from "./resolve-cli-locale.js";

/**
 * Single i18next namespace holding the nested `commands` / `options` /
 * `output` sections, so keys read as dotted paths (e.g.
 * `t("commands.convert")`).
 */
const CLI_NAMESPACE = "cli";

const resources: LocaleResources = {
  en: { [CLI_NAMESPACE]: enCatalog },
  es: { [CLI_NAMESPACE]: esCatalog },
};

const translator = createTranslator({
  locale: resolveCliLocale(),
  resources,
  defaultNS: CLI_NAMESPACE,
});

/** Active resolved locale (`en` or `es`), fixed at module load from env. */
export const activeLocale = translator.locale;

/** Translate a dotted `commands.* | options.* | output.*` catalog key. */
export const t = translator.t;
