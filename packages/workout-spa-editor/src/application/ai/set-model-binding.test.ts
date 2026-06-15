/**
 * setModelBinding — upsert + provider-existence validation.
 */
import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { ProviderNotFoundError } from "./errors";
import { setModelBinding } from "./set-model-binding";

const provider: LlmProviderConfig = {
  id: "prov-1",
  type: "anthropic",
  apiKey: "k",
  model: "legacy",
  label: "A",
  isDefault: true,
  createdAt: 1,
};

describe("setModelBinding", () => {
  it("should upsert the binding when the provider exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.aiProviders.put(provider);

    // Act
    await setModelBinding(persistence, {
      profileId: "p-1",
      purpose: "chat",
      providerId: "prov-1",
      modelId: "m1",
    });

    // Assert
    const stored = await persistence.aiModelBindings.get("p-1", "chat");
    expect(stored).toMatchObject({ providerId: "prov-1", modelId: "m1" });
  });

  it("should throw when the referenced provider is missing", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const act = setModelBinding(persistence, {
      profileId: "p-1",
      purpose: "chat",
      providerId: "ghost",
      modelId: "m1",
    });

    // Assert
    await expect(act).rejects.toBeInstanceOf(ProviderNotFoundError);
  });
});
