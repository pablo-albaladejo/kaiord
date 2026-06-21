import { describe, expect, it, vi } from "vitest";

import { createInMemoryConnectionRepository } from "../../test-utils/in-memory-connection-repository";
import { createApiKeyConnectionProvider } from "./api-key-connection-provider";

const NOW = "2026-06-19T00:00:00.000Z";

const setup = (validateResult: boolean) => {
  const repository = createInMemoryConnectionRepository();
  const validate = vi.fn().mockResolvedValue(validateResult);
  const encryptCredential = vi.fn(async (plain: string) => `enc(${plain})`);
  const provider = createApiKeyConnectionProvider({
    providerId: "intervals",
    repository,
    validate,
    encryptCredential,
    clock: () => NOW,
  });
  return { repository, validate, encryptCredential, provider };
};

describe("createApiKeyConnectionProvider", () => {
  it("should validate, encrypt and store the key on a valid connect", async () => {
    // Arrange
    const { repository, encryptCredential, provider } = setup(true);

    // Act
    await provider.connect({ profileId: "p1", credential: "secret-key" });

    // Assert
    const stored = await repository.get("p1", "intervals");
    expect(stored).toMatchObject({
      status: "connected",
      mechanism: "api-key",
      credentialRef: "enc(secret-key)",
    });
    expect(encryptCredential).toHaveBeenCalledWith("secret-key");
  });

  it("should reject and persist nothing when the key is invalid", async () => {
    // Arrange
    const { repository, provider } = setup(false);

    // Act
    const attempt = provider.connect({ profileId: "p1", credential: "bad" });

    // Assert
    await expect(attempt).rejects.toThrow(/rejected/i);
    expect(await repository.get("p1", "intervals")).toBeUndefined();
  });

  it("should reject when no credential is supplied", async () => {
    // Arrange
    const { validate, provider } = setup(true);

    // Act
    const attempt = provider.connect({ profileId: "p1" });

    // Assert
    await expect(attempt).rejects.toThrow(/required/i);
    expect(validate).not.toHaveBeenCalled();
  });

  it("should delete the record (and credential) on disconnect", async () => {
    // Arrange
    const { repository, provider } = setup(true);
    await provider.connect({ profileId: "p1", credential: "secret-key" });

    // Act
    await provider.disconnect("p1");

    // Assert
    expect(await repository.get("p1", "intervals")).toBeUndefined();
  });
});
