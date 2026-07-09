import {
  DEFAULT_LOCALE,
  findParityViolations,
  type LocaleNamespaces,
  type NamespaceDictionary,
  SUPPORTED_LOCALES,
} from "@kaiord/i18n";
import { describe, expect, it } from "vitest";

// Eagerly load every catalog here (test-only bundle) to assert parity against
// English without going through the app's lazy locale loader.
const MODULES = import.meta.glob<NamespaceDictionary>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

const namespaceOf = (path: string): string =>
  path.slice(path.lastIndexOf("/") + 1, -".json".length);

const localeOf = (path: string): string => {
  const dir = path.slice(0, path.lastIndexOf("/"));
  return dir.slice(dir.lastIndexOf("/") + 1);
};

const catalogFor = (locale: string): LocaleNamespaces =>
  Object.fromEntries(
    Object.entries(MODULES)
      .filter(([path]) => localeOf(path) === locale)
      .map(([path, dict]) => [namespaceOf(path), dict])
  );

describe("SPA i18n resource parity", () => {
  const en = catalogFor(DEFAULT_LOCALE);
  const others = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);

  it.each(others)(
    "should keep %s at key parity with en across every namespace",
    (locale) => {
      // Arrange
      const catalog = catalogFor(locale);

      // Act
      const violations = findParityViolations(en, catalog);

      // Assert
      expect(violations).toEqual([]);
    }
  );
});
