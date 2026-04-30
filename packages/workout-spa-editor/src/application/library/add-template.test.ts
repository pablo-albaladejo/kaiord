import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addTemplate } from "./add-template";
import { makeKrd } from "./test-fixtures";

describe("addTemplate", () => {
  it("persists a new template with the supplied fields", async () => {
    const persistence = createInMemoryPersistence();

    const template = await addTemplate(
      persistence,
      "Tempo Ride",
      "cycling",
      makeKrd(),
      { tags: ["base", "endurance"], difficulty: "intermediate", duration: 60 }
    );

    expect(template.name).toBe("Tempo Ride");
    expect(template.sport).toBe("cycling");
    expect(template.tags).toEqual(["base", "endurance"]);
    expect(template.difficulty).toBe("intermediate");
    expect(template.duration).toBe(60);
    const stored = await persistence.templates.getById(template.id);
    expect(stored).toEqual(template);
  });

  it("generates a fresh id per template", async () => {
    const persistence = createInMemoryPersistence();

    const a = await addTemplate(persistence, "A", "cycling", makeKrd());
    const b = await addTemplate(persistence, "B", "running", makeKrd());

    expect(a.id).not.toBe(b.id);
    expect(await persistence.templates.getAll()).toHaveLength(2);
  });

  it("propagates rejections from the persistence port", async () => {
    const persistence = createInMemoryPersistence();
    persistence.templates.put = () =>
      Promise.reject(new Error("simulated quota exceeded"));

    await expect(
      addTemplate(persistence, "Will Fail", "cycling", makeKrd())
    ).rejects.toThrow("simulated quota exceeded");
  });
});
