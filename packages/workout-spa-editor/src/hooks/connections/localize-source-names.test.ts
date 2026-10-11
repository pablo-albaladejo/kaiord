import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ConnectionSource } from "../../application/connections/connection-source";
import { appI18n, setActiveLocale } from "../../i18n/i18n";
import { getTranslate } from "../../i18n/use-translate";
import { localizeSourceNames } from "./localize-source-names";

const source = (id: string, name: string) =>
  ({ id, name }) as unknown as ConnectionSource;

describe("localizeSourceNames", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should name manual entry in the active locale and keep brand names", () => {
    // Arrange
    const t = getTranslate("connections", "es");
    const sources = [source("garmin", "Garmin"), source("manual", "Manual Entry")];

    // Act
    const names = localizeSourceNames(sources, t).map((s) => s.name);

    // Assert
    expect(names).toEqual(["Garmin", "Entrada manual"]);
  });
});
