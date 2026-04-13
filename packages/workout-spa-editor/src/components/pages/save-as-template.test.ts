/**
 * Save as Template Integration Test
 *
 * Verifies that saving a template via the library store
 * persists to the Dexie templates table.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import { useLibraryStore } from "../../store/library-store";

describe("Save as Template", () => {
  beforeEach(async () => {
    await db.table("templates").clear();
    useLibraryStore.setState({ templates: [] });
  });

  it("creates a template record in Dexie", async () => {
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

    const { addTemplate } = useLibraryStore.getState();
    addTemplate("My Template", "cycling", krd, {
      tags: ["endurance"],
    });

    // Wait for async Dexie persistence
    await new Promise((r) => setTimeout(r, 200));

    const templates = await db.table("templates").toArray();
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("My Template");
    expect(templates[0].sport).toBe("cycling");
    expect(templates[0].tags).toEqual(["endurance"]);
  });
});
