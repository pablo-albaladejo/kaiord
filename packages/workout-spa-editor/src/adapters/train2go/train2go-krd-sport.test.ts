import { sportSchema, subSportSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { resolveT2GSport, T2G_SPORT_TO_KRD } from "./train2go-krd-sport";

describe("T2G_SPORT_TO_KRD", () => {
  it("should map every entry to a valid KRD sport and subSport", () => {
    // Arrange
    const entries = Object.values(T2G_SPORT_TO_KRD);

    // Act
    const invalid = entries.filter(
      ({ sport, subSport }) =>
        !sportSchema.safeParse(sport).success ||
        (subSport !== undefined && !subSportSchema.safeParse(subSport).success)
    );

    // Assert
    expect(invalid).toEqual([]);
  });

  it("should resolve stretching to training + flexibility_training", () => {
    // Arrange
    const rawKey = "stretching";

    // Act
    const resolved = resolveT2GSport(rawKey);

    // Assert
    expect(resolved).toEqual({
      sport: "training",
      subSport: "flexibility_training",
    });
  });

  it("should resolve rest to null (no trainable workout)", () => {
    // Arrange
    const rawKey = "rest";

    // Act
    const resolved = resolveT2GSport(rawKey);

    // Assert
    expect(resolved).toBeNull();
  });

  it("should resolve an unknown sport key to null", () => {
    // Arrange
    const rawKey = "underwater_basket_weaving";

    // Act
    const resolved = resolveT2GSport(rawKey);

    // Assert
    expect(resolved).toBeNull();
  });

  it("should resolve case-insensitively", () => {
    // Arrange
    const rawKey = "CYCLING";

    // Act
    const resolved = resolveT2GSport(rawKey);

    // Assert
    expect(resolved).toEqual({ sport: "cycling" });
  });
});
