/**
 * Save as Template Integration Test
 *
 * Verifies that the `addTemplate` application use case persists to
 * the Dexie templates table via `PersistencePort`.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { addTemplate } from "../../application/library/add-template";

describe("Save as Template", () => {
  beforeEach(async () => {
    await db.table("templates").clear();
  });

  it("should create a template record in Dexie", async () => {
    // Arrange

    const persistence = createDexiePersistence(db);
    const krd = {
      version: "1.0",
      type: "structured_workout" as const,
      metadata: { created: "2026-01-01T00:00:00Z", sport: "cycling" },
      extensions: {
        structured_workout: {
          name: "My Workout",
          sport: "cycling",
          steps: [],
        },
      },
    };

    await addTemplate(persistence, "My Template", "cycling", krd, {
      tags: ["endurance"],
    });

    // Act

    const templates = await db.table("templates").toArray();

    // Assert

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("My Template");
    expect(templates[0].sport).toBe("cycling");
    expect(templates[0].tags).toEqual(["endurance"]);
  });
});
