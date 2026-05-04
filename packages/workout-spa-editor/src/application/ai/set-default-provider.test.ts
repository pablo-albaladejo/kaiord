import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { ProviderNotFoundError } from "./errors";
import { setDefaultProvider } from "./set-default-provider";
import { baseProvider, secondProvider } from "./test-fixtures";

describe("setDefaultProvider", () => {
  it("should flip the default flag to a single provider", async () => {
    const persistence = createInMemoryPersistence();
    const first = await addProvider(persistence, baseProvider);
    const second = await addProvider(persistence, secondProvider);

    await setDefaultProvider(persistence, second.id);

    const all = await persistence.aiProviders.getAll();
    expect(all.find((p) => p.id === first.id)?.isDefault).toBe(false);
    expect(all.find((p) => p.id === second.id)?.isDefault).toBe(true);
  });

  it("should throw ProviderNotFoundError for unknown ids", async () => {
    const persistence = createInMemoryPersistence();
    await addProvider(persistence, baseProvider);

    await expect(
      setDefaultProvider(persistence, "missing-id")
    ).rejects.toBeInstanceOf(ProviderNotFoundError);
  });
});
