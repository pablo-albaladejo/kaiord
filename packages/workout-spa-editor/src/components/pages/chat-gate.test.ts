import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { Profile } from "../../types/profile";
import { resolveChatGate } from "./chat-gate";

const profile = { id: "p1", name: "Mi perfil" } as Profile;
const active = { id: "p1", profile };

const provider = (over: Partial<LlmProviderConfig>): LlmProviderConfig => ({
  id: "a",
  type: "anthropic",
  apiKey: "sk",
  label: "Mi Claude",
  isDefault: true,
  createdAt: 1,
  ...over,
});

describe("resolveChatGate", () => {
  it("should wait while the profile or the providers load", () => {
    // Arrange
    const providers = [provider({})];

    // Act
    const gates = [
      resolveChatGate(undefined, providers),
      resolveChatGate(active, undefined),
    ];

    // Assert
    expect(gates).toEqual([{ kind: "loading" }, { kind: "loading" }]);
  });

  it("should ask for a profile before anything else", () => {
    // Arrange
    const noProfile = { id: null, profile: null };

    // Act
    const gate = resolveChatGate(noProfile, [provider({})]);

    // Assert
    expect(gate).toEqual({ kind: "noProfile" });
  });

  it("should name a provider that came back from a backup without its key", () => {
    // Arrange
    const providers = [
      provider({ apiKey: "", apiKeyMissing: true, label: "Restaurado" }),
    ];

    // Act
    const gate = resolveChatGate(active, providers);

    // Assert
    expect(gate).toEqual({ kind: "missingKey", label: "Restaurado" });
  });

  it("should never offer a keyless provider to the chat", () => {
    // Arrange
    const keyed = provider({ id: "b", isDefault: false });
    const keyless = provider({ apiKey: "", apiKeyMissing: true });

    // Act
    const gate = resolveChatGate(active, [keyless, keyed]);

    // Assert
    expect(gate).toEqual({ kind: "ready", providers: [keyed] });
  });

  it("should send the user to set up a provider when there is none", () => {
    // Arrange

    // Act
    const gate = resolveChatGate(active, []);

    // Assert
    expect(gate).toEqual({ kind: "noProvider" });
  });
});
