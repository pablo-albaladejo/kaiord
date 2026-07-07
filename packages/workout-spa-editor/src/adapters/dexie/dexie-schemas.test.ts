/**
 * Schema declaration tests. These guard against drift in the Dexie
 * `stores()` definition — they don't open IndexedDB. Migration
 * round-trips live in `dexie-v16-migration.test.ts`.
 */
import { describe, expect, it } from "vitest";

import { SCHEMAS } from "./dexie-schemas";

type SchemaVersion = keyof typeof SCHEMAS;

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
});

describe("SCHEMAS.v21 (chat transcript store)", () => {
  it("should declare chatMessages with the per-profile chronological index", () => {
    // Arrange
    const stores = SCHEMAS.v21 as Record<string, string>;

    // Act

    // Assert
    expect(stores.chatMessages).toBe("id, profileId, [profileId+createdAt]");
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
});

describe("SCHEMAS.v25 (multi-conversation chat)", () => {
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

describe("SCHEMAS.v27 (Data Hub domain stores)", () => {
  it("should mirror the coachingActivities index shape on plannedSessions", () => {
    // Arrange
    const stores = SCHEMAS.v27 as Record<string, string>;

    // Act

    // Assert
    expect(stores.plannedSessions).toBe(stores.coachingActivities);
  });

  it("should declare the activities store with provenance-dedup + date indexes", () => {
    // Arrange
    const stores = SCHEMAS.v27 as Record<string, string>;

    // Act

    // Assert
    expect(stores.activities).toBe(
      "id, [profileId+date], [profileId+sourceBridgeId+externalId]"
    );
  });
});

describe("SCHEMAS.v31 (lab-analytics stores)", () => {
  it("should declare labReports with the date-listing + per-profile indexes", () => {
    // Arrange
    const stores = SCHEMAS.v31 as Record<string, string>;

    // Act

    // Assert
    expect(stores.labReports).toBe("id, [profileId+date], [profileId+id]");
  });

  it("should declare labValues with the series + report indexes", () => {
    // Arrange
    const stores = SCHEMAS.v31 as Record<string, string>;

    // Act

    // Assert
    expect(stores.labValues).toBe(
      "id, [profileId+parameterKey+date], [profileId+reportId]"
    );
  });
});

describe("SCHEMAS cross-version drift guards", () => {
  const byteEquivalentPairs: ReadonlyArray<{
    prev: SchemaVersion;
    next: SchemaVersion;
  }> = [
    { prev: "v13", next: "v16" },
    { prev: "v20", next: "v21" },
    { prev: "v23", next: "v24" },
    { prev: "v26", next: "v27" },
    { prev: "v30", next: "v31" },
  ];

  it.each(byteEquivalentPairs)(
    "should leave every $prev store byte-equivalent in $next",
    ({ prev, next }) => {
      // Arrange
      const prevStores = SCHEMAS[prev] as Record<string, string>;
      const nextStores = SCHEMAS[next] as Record<string, string>;

      // Act

      // Assert
      for (const key of Object.keys(prevStores)) {
        expect(nextStores[key]).toBe(prevStores[key]);
      }
    }
  );

  const addedStoreCases: ReadonlyArray<{
    prev: SchemaVersion;
    next: SchemaVersion;
    added: ReadonlyArray<string>;
  }> = [
    { prev: "v13", next: "v16", added: HEALTH_STORES },
    { prev: "v20", next: "v21", added: ["chatMessages"] },
    { prev: "v22", next: "v23", added: [] },
    { prev: "v23", next: "v24", added: ["connections"] },
    { prev: "v24", next: "v25", added: ["chatConversations"] },
    { prev: "v26", next: "v27", added: ["activities", "plannedSessions"] },
    { prev: "v30", next: "v31", added: ["labReports", "labValues"] },
  ];

  it.each(addedStoreCases)(
    "should add only the expected stores from $prev to $next",
    ({ prev, next, added }) => {
      // Arrange
      const prevKeys = new Set(Object.keys(SCHEMAS[prev]));

      // Act
      const actualAdded = Object.keys(SCHEMAS[next]).filter(
        (k) => !prevKeys.has(k)
      );

      // Assert
      expect(actualAdded.slice().sort()).toEqual([...added].sort());
    }
  );
});
