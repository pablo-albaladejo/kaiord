import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { addProvider } from "./add-provider";
import { ProviderNotFoundError } from "./errors";
import { baseProvider } from "./test-fixtures";
import { updateProvider } from "./update-provider";

describe("updateProvider", () => {
  it("should merge the partial update onto the existing provider", async () => {
    const persistence = createInMemoryPersistence();
    const created = await addProvider(persistence, baseProvider);

    const updated = await updateProvider(persistence, created.id, {
      label: "Renamed",
      model: "claude-haiku-4-5",
    });

    expect(updated.label).toBe("Renamed");
    expect(updated.model).toBe("claude-haiku-4-5");
    expect(updated.id).toBe(created.id);
    expect(updated.isDefault).toBe(true);
  });

  it("should throw ProviderNotFoundError for unknown ids", async () => {
    const persistence = createInMemoryPersistence();

    await expect(
      updateProvider(persistence, "missing-id", { label: "Whatever" })
    ).rejects.toBeInstanceOf(ProviderNotFoundError);
  });
});
