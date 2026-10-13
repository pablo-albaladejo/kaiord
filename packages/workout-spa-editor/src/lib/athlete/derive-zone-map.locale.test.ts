import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../i18n/i18n";
import { getTranslate } from "../../i18n/use-translate";
import { deriveZoneMap } from "./derive-zone-map";
import { profileWith } from "./test-profile";

const LTHR = 168;

describe("deriveZoneMap heart-rate unit in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should label the HR zone ranges with ppm and never bpm", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: LTHR });
    const hrUnit = getTranslate("common", "es")("units.hr");

    // Act
    const map = deriveZoneMap(profile, "cycling", "metric", hrUnit);

    // Assert
    const ranges = (map ?? []).map((zone) => zone.range).join(" ");
    expect(ranges).toContain(" ppm");
    expect(ranges).not.toContain("bpm");
  });

  it("should keep bpm in English", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: LTHR });

    // Act
    const map = deriveZoneMap(profile, "cycling");

    // Assert
    expect(map?.[0]?.range).toMatch(/ bpm$/);
  });
});
