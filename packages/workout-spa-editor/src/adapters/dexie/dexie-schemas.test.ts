/**
 * Schema declaration tests. These guard against drift in the Dexie
 * `stores()` definition — they don't open IndexedDB. Migration
 * round-trips live in `dexie-v16-migration.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { SCHEMAS } from "./dexie-schemas";

const HEALTH_STORES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
] as const;

describe("SCHEMAS.v16 (health-domain stores)", () => {
  it("should declare every health store with the per-profile date-range index", () => {
    // Arrange
    const stores = SCHEMAS.v16 as Record<string, string>;

    // Act

    // Assert
    for (const name of HEALTH_STORES) {
      expect(stores[name]).toBe("id, profileId, [profileId+date], date");
    }
  });

  it("should leave every v13 store byte-equivalent to its v13 form", () => {
    // Arrange
    const v13 = SCHEMAS.v13 as Record<string, string>;
    const v16 = SCHEMAS.v16 as Record<string, string>;

    // Act

    // Assert
    for (const key of Object.keys(v13)) {
      expect(v16[key]).toBe(v13[key]);
    }
  });

  it("should add exactly the six health stores on top of v13", () => {
    // Arrange
    const v13Keys = new Set(Object.keys(SCHEMAS.v13));
    const v16Keys = new Set(Object.keys(SCHEMAS.v16));
    const added = [...v16Keys].filter((k) => !v13Keys.has(k));

    // Act

    // Assert
    expect(added.sort()).toEqual([...HEALTH_STORES].sort());
  });
});

describe("SCHEMAS.v21 (chat transcript store)", () => {
  it("should declare chatMessages with the per-profile chronological index", () => {
    // Arrange
    const stores = SCHEMAS.v21 as Record<string, string>;

    // Act

    // Assert
    expect(stores.chatMessages).toBe("id, profileId, [profileId+createdAt]");
  });

  it("should add exactly the chatMessages store on top of v20", () => {
    // Arrange
    const v20Keys = new Set(Object.keys(SCHEMAS.v20));
    const v21Keys = new Set(Object.keys(SCHEMAS.v21));
    const added = [...v21Keys].filter((k) => !v20Keys.has(k));

    // Act

    // Assert
    expect(added).toEqual(["chatMessages"]);
  });

  it("should leave every v20 store byte-equivalent to its v20 form", () => {
    // Arrange
    const v20 = SCHEMAS.v20 as Record<string, string>;
    const v21 = SCHEMAS.v21 as Record<string, string>;

    // Act

    // Assert
    for (const key of Object.keys(v20)) {
      expect(v21[key]).toBe(v20[key]);
    }
  });
});
