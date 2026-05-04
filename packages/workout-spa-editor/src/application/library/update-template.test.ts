import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addTemplate } from "./add-template";
import { TemplateNotFoundError } from "./errors";
import { makeKrd } from "./test-fixtures";
import { updateTemplate } from "./update-template";

describe("updateTemplate", () => {
  it("should apply the supplied updates and bumps updatedAt", async () => {
    const persistence = createInMemoryPersistence();
    const original = await addTemplate(
      persistence,
      "Old Name",
      "cycling",
      makeKrd(),
      { tags: ["old"], duration: 30 }
    );

    const updated = await updateTemplate(persistence, original.id, {
      name: "New Name",
      tags: ["new", "fresh"],
      duration: 45,
    });

    expect(updated.name).toBe("New Name");
    expect(updated.tags).toEqual(["new", "fresh"]);
    expect(updated.duration).toBe(45);
    expect(updated.updatedAt >= original.updatedAt).toBe(true);
    const stored = await persistence.templates.getById(original.id);
    expect(stored).toEqual(updated);
  });

  it("should throw TemplateNotFoundError for an unknown id", async () => {
    const persistence = createInMemoryPersistence();

    await expect(
      updateTemplate(persistence, "missing-id", { name: "X" })
    ).rejects.toBeInstanceOf(TemplateNotFoundError);
  });

  it("should roll back when the put rejects mid-transaction", async () => {
    const persistence = createInMemoryPersistence();
    const original = await addTemplate(
      persistence,
      "Original",
      "cycling",
      makeKrd()
    );

    const realPut = persistence.templates.put;
    persistence.templates.put = () => Promise.reject(new Error("simulated"));

    await expect(
      updateTemplate(persistence, original.id, { name: "Renamed" })
    ).rejects.toThrow("simulated");

    persistence.templates.put = realPut;
    const stored = await persistence.templates.getById(original.id);
    expect(stored?.name).toBe("Original");
  });
});
