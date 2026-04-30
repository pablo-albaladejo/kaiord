import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { clearAllProviders } from "./clear-all-providers";
import { baseProvider, secondProvider } from "./test-fixtures";

describe("clearAllProviders", () => {
  it("removes every provider", async () => {
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);
    await addProvider(persistence, secondProvider);

    await clearAllProviders(persistence);

    expect(await persistence.aiProviders.getAll()).toHaveLength(0);
  });

  it("propagates persistence rejection so the caller can surface a toast", async () => {
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);

    const original = persistence.aiProviders.delete.bind(
      persistence.aiProviders
    );
    persistence.aiProviders.delete = async () => {
      throw new Error("disk full");
    };

    await expect(clearAllProviders(persistence)).rejects.toThrow("disk full");

    persistence.aiProviders.delete = original;
  });
});
