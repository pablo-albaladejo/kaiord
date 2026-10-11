import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../i18n/i18n";
import { getTranslate } from "../i18n/use-translate";
import { zoneMethodLabel, zoneNameLabel } from "./zone-name-label";

const es = getTranslate("zones", "es");

beforeAll(async () => {
  await setActiveLocale("es");
});
afterAll(async () => {
  await appI18n.changeLanguage("en");
});

describe("zoneNameLabel", () => {
  it("should translate a preset zone name", () => {
    // Arrange

    // Act
    const label = zoneNameLabel("VO2 Max", es);

    // Assert
    expect(label).toBe("VO₂ máx");
  });

  it("should number a generic zone in the reader's language", () => {
    // Arrange

    // Act
    const label = zoneNameLabel("Zone 3", es);

    // Assert
    expect(label).toBe("Zona 3");
  });

  it("should leave a name the athlete typed as written", () => {
    // Arrange

    // Act
    const label = zoneNameLabel("Easy Sunday", es);

    // Assert
    expect(label).toBe("Easy Sunday");
  });
});

describe("zoneMethodLabel", () => {
  it("should call a table no preset owns the athlete's own", () => {
    // Arrange

    // Act
    const label = zoneMethodLabel("train2go", es);

    // Assert
    expect(label).toBe("Tus propias zonas");
  });
});
