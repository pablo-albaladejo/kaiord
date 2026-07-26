import { describe, expect, it } from "vitest";

import {
  buildSportCatalog,
  whoopSportsResponseSchema,
} from "./whoop-sports.schema";

const SWIMMING_ID = 33;
const CYCLING_ID = 1;

describe("whoopSportsResponseSchema", () => {
  it.each([
    { shape: "bare-array", payload: [{ id: SWIMMING_ID, name: "Swimming" }] },
    {
      shape: "sports-wrapped",
      payload: { sports: [{ id: SWIMMING_ID, name: "Swimming" }] },
    },
  ])("should normalize a $shape sports/history response", ({ payload }) => {
    // Arrange

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
