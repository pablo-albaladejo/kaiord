import { describe, expect, it } from "vitest";

import { createConnectionCredentials } from "./connection-credentials";

const PASSPHRASE = "device-abc";

describe("createConnectionCredentials", () => {
  it("should encrypt a credential to ciphertext that is not the plaintext", async () => {
    // Arrange
    const credentials = createConnectionCredentials(() => PASSPHRASE);

    // Act
    const blob = await credentials.encrypt("my-api-key");

    // Assert
    expect(blob).not.toBe("my-api-key");
    expect(blob).not.toContain("my-api-key");
  });

  it("should round-trip the credential through encrypt then decrypt", async () => {
    // Arrange
    const credentials = createConnectionCredentials(() => PASSPHRASE);

    // Act
    const blob = await credentials.encrypt("my-api-key");
    const recovered = await credentials.decrypt(blob);

    // Assert
    expect(recovered).toBe("my-api-key");
  });
});
