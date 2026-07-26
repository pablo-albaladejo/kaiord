import { describe, expect, it } from "vitest";

import {
  buildSportCatalog,
  whoopSportsResponseSchema,
} from "./whoop-sports.schema";

const SWIMMING_ID = 33;
const CYCLING_ID = 1;

describe("whoopSportsResponseSchema", () => {
  it("should normalize a bare-array sports/history response", () => {
    // Arrange
    const payload = [{ id: SWIMMING_ID, name: "Swimming" }];

    // Act
    const result = whoopSportsResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].name).toBe("Swimming");
  });

  it("should normalize a sports-wrapped sports/history response", () => {
    // Arrange
    const payload = { sports: [{ id: SWIMMING_ID, name: "Swimming" }] };

    // Act
    const result = whoopSportsResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].name).toBe("Swimming");
  });
});

describe("buildSportCatalog", () => {
  it("should build an id-to-name lookup from the sports catalog", () => {
    // Arrange
    const sports = [
      { id: SWIMMING_ID, name: "Swimming" },
      { id: CYCLING_ID, name: "Cycling" },
    ];

    // Act
    const catalog = buildSportCatalog(sports);

    // Assert
    expect(catalog.get(SWIMMING_ID)).toBe("Swimming");
    expect(catalog.get(CYCLING_ID)).toBe("Cycling");
  });
});
