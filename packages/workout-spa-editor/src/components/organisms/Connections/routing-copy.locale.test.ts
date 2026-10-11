import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appI18n, setActiveLocale } from "../../../i18n/i18n";
import { getTranslate } from "../../../i18n/use-translate";
import { originLabel, sourceName } from "./routing-copy";

describe("routing copy in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name manual entry in Spanish and keep brand names", () => {
    // Arrange
    const t = getTranslate("connections", "es");

    // Act
    const names = [sourceName("manual", t), sourceName("garmin", t)];

    // Assert
    expect(names).toEqual(["Entrada manual", "Garmin"]);
  });

  it("should name manual entry in Spanish as a row's only source", () => {
    // Arrange
    const t = getTranslate("connections", "es");

    // Act
    const label = originLabel({ kind: "only", sourceId: "manual" }, t);

    // Assert
    expect(label).toBe("Entrada manual");
  });
});
