import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { removeProvider } from "./remove-provider";
import { baseProvider, secondProvider } from "./test-fixtures";

describe("removeProvider", () => {
  it("deletes the target and promotes the next provider when the deleted was default (I2)", async () => {
    const persistence = createInMemoryPersistence();
    const first = await addProvider(persistence, baseProvider);
    const second = await addProvider(persistence, secondProvider);

    await removeProvider(persistence, first.id);

    const all = await persistence.aiProviders.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(second.id);
    expect(all[0].isDefault).toBe(true);
  });

  it("leaves the existing default untouched when removing a non-default provider", async () => {
    const persistence = createInMemoryPersistence();
    const first = await addProvider(persistence, baseProvider);
    const second = await addProvider(persistence, secondProvider);

    await removeProvider(persistence, second.id);

    const all = await persistence.aiProviders.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(first.id);
    expect(all[0].isDefault).toBe(true);
  });

  it("no-ops when the target id does not exist", async () => {
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);

    await removeProvider(persistence, "missing-id");

    expect(await persistence.aiProviders.getAll()).toHaveLength(1);
  });
});
