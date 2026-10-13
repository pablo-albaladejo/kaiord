import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROFILE_NAMES,
  defaultProfileName,
} from "./default-profile-name";
import en from "./locales/en/athlete.json";
import es from "./locales/es/athlete.json";

describe("defaultProfileName", () => {
  it.each([
    ["en-US", "My athlete"],
    ["es-ES", "Mi atleta"],
    ["fr-FR", "My athlete"],
  ])(
    "should name the athlete for %s without loading a catalog",
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
    "should quote the stored athlete name in the %s notice, not a fixed one",
    (locale, notice) => {
      // Arrange
      const fixedName = DEFAULT_PROFILE_NAMES[locale];

      // Act
      const quoted = {
        placeholder: notice.includes("{{name}}"),
        fixedName: notice.includes(fixedName),
      };

      // Assert
      expect(quoted).toEqual({ placeholder: true, fixedName: false });
    }
  );
});
