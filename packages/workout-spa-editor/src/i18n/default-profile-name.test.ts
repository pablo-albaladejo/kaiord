import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROFILE_NAMES,
  defaultProfileName,
} from "./default-profile-name";
import en from "./locales/en/athlete.json";
import es from "./locales/es/athlete.json";

describe("defaultProfileName", () => {
  it.each([
    ["en-US", "My profile"],
    ["es-ES", "Mi perfil"],
    ["fr-FR", "My profile"],
  ])(
    "should name the profile for %s without loading a catalog",
    (language, expected) => {
      // Arrange
      const navigatorLanguage = language;

      // Act
      const name = defaultProfileName(navigatorLanguage);

      // Assert
      expect(name).toBe(expected);
    }
  );

  it.each([
    ["en", en.defaultProfile.notice],
    ["es", es.defaultProfile.notice],
  ] as const)(
    "should name the same profile the %s notice announces",
    (locale, notice) => {
      // Arrange
      const name = DEFAULT_PROFILE_NAMES[locale];

      // Act
      const announced = notice.includes(name);

      // Assert
      expect(announced).toBe(true);
    }
  );
});
