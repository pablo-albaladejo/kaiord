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

describe("SCHEMAS.v23 (auto-push updatedAt indexes)", () => {
  it("should index updatedAt on the workouts/templates/profiles stores", () => {
    // Arrange
    const stores = SCHEMAS.v23 as Record<string, string>;

    // Act

    // Assert
    for (const name of ["workouts", "templates", "profiles"]) {
      expect(stores[name].split(", ")).toContain("updatedAt");
    }
  });

  it("should add no new stores on top of v22 (index-only change)", () => {
    // Arrange
    const v22Keys = new Set(Object.keys(SCHEMAS.v22));
    const v23Keys = new Set(Object.keys(SCHEMAS.v23));

    // Act
    const added = [...v23Keys].filter((k) => !v22Keys.has(k));

    // Assert
    expect(added).toEqual([]);
  });

  it("should change only workouts/templates/profiles from v22", () => {
    // Arrange
    const v22 = SCHEMAS.v22 as Record<string, string>;
    const v23 = SCHEMAS.v23 as Record<string, string>;

    // Act
    const changed = Object.keys(v22).filter((k) => v23[k] !== v22[k]);

    // Assert
    expect(changed.sort()).toEqual(["profiles", "templates", "workouts"]);
  });
});

describe("SCHEMAS.v24 (connections store)", () => {
  it("should declare connections with the composite key + profileId index", () => {
    // Arrange
    const stores = SCHEMAS.v24 as Record<string, string>;

    // Act

    // Assert
    expect(stores.connections).toBe("[profileId+providerId], profileId");
  });

  it("should add exactly the connections store on top of v23", () => {
    // Arrange
    const v23Keys = new Set(Object.keys(SCHEMAS.v23));
    const v24Keys = new Set(Object.keys(SCHEMAS.v24));

    // Act
    const added = [...v24Keys].filter((k) => !v23Keys.has(k));

    // Assert
    expect(added).toEqual(["connections"]);
  });

  it("should leave every v23 store byte-equivalent to its v23 form", () => {
    // Arrange
    const v23 = SCHEMAS.v23 as Record<string, string>;
    const v24 = SCHEMAS.v24 as Record<string, string>;

    // Act

    // Assert
    for (const key of Object.keys(v23)) {
      expect(v24[key]).toBe(v23[key]);
    }
  });
});

describe("SCHEMAS.v25 (multi-conversation chat)", () => {
  it("should add exactly the chatConversations store on top of v24", () => {
    // Arrange
    const v24Keys = new Set(Object.keys(SCHEMAS.v24));
    const v25Keys = new Set(Object.keys(SCHEMAS.v25));

    // Act
    const added = [...v25Keys].filter((k) => !v24Keys.has(k));

    // Assert
    expect(added).toEqual(["chatConversations"]);
  });

  it("should order conversations by the per-profile updatedAt index", () => {
    // Arrange
    const stores = SCHEMAS.v25 as Record<string, string>;

    // Act

    // Assert
    expect(stores.chatConversations).toBe(
      "id, profileId, [profileId+updatedAt]"
    );
  });

  it("should add the conversation-scoped index to chatMessages", () => {
    // Arrange
    const stores = SCHEMAS.v25 as Record<string, string>;

    // Act
    const indexes = stores.chatMessages.split(", ");

    // Assert
    expect(indexes).toContain("conversationId");
    expect(indexes).toContain("[profileId+conversationId+createdAt]");
    expect(indexes).toContain("[profileId+createdAt]");
  });
});
