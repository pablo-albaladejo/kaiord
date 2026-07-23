import { describe, expect, it } from "vitest";

import type { LocalePreference } from "../types/user-preferences";
import { resolveLocale } from "./resolve-locale";

const cases: Array<{
  preference: LocalePreference | undefined;
  browser: string;
  expected: "en" | "es";
}> = [
  { preference: "es", browser: "en-US", expected: "es" },
  { preference: "en", browser: "es-ES", expected: "en" },
  { preference: "auto", browser: "es-419", expected: "es" },
  { preference: "auto", browser: "fr-FR", expected: "en" },
  { preference: undefined, browser: "es-ES", expected: "es" },
];

describe("resolveLocale", () => {
  it.each(cases)(
    "should resolve preference $preference with browser $browser to $expected",
    ({ preference, browser, expected }) => {
      // Arrange

      // Act
      const result = resolveLocale(preference, browser);

      // Assert
      expect(result).toBe(expected);
    }
  );
});
