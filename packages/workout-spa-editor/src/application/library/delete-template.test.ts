import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addTemplate } from "./add-template";
import { deleteTemplate } from "./delete-template";
import { makeKrd } from "./test-fixtures";

describe("deleteTemplate", () => {
  it("should remove the template from persistence", async () => {
    const persistence = createInMemoryPersistence();
    const a = await addTemplate(persistence, "A", "cycling", makeKrd());
    const b = await addTemplate(persistence, "B", "running", makeKrd());

    await deleteTemplate(persistence, a.id);

    expect(await persistence.templates.getById(a.id)).toBeUndefined();
    expect(await persistence.templates.getById(b.id)).toEqual(b);
    expect(await persistence.templates.getAll()).toHaveLength(1);
  });

  it("should be a no-op when deleting an unknown id", async () => {
    const persistence = createInMemoryPersistence();
    await addTemplate(persistence, "Survivor", "cycling", makeKrd());

    await expect(
      deleteTemplate(persistence, "missing-id")
    ).resolves.toBeUndefined();
    expect(await persistence.templates.getAll()).toHaveLength(1);
  });

  it("should propagate rejections from the persistence port", async () => {
    const persistence = createInMemoryPersistence();
    const t = await addTemplate(persistence, "X", "cycling", makeKrd());
    persistence.templates.delete = () => Promise.reject(new Error("simulated"));

    await expect(deleteTemplate(persistence, t.id)).rejects.toThrow(
      "simulated"
    );
  });
});
