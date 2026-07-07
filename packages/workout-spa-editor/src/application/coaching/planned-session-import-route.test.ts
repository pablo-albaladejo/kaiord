import { describe, expect, it } from "vitest";

import { createInMemoryIntegrationPolicyRepository } from "../../test-utils/in-memory-integration-policy-repository";
import { hasEnabledPlannedSessionImportRoute } from "./planned-session-import-route";

const NOW = "2026-05-01T10:00:00.000Z";

const policy = (enabled: boolean) => ({
  id: `00000000-0000-4000-8000-00000000000${enabled ? 1 : 2}`,
  profileId: "p1",
  dataType: "planned-session" as const,
  bridgeId: "train2go-bridge",
  direction: "import" as const,
  mode: "auto" as const,
  enabled,
  updatedAt: NOW,
});

describe("hasEnabledPlannedSessionImportRoute", () => {
  it("should be true when an enabled planned-session import policy exists", async () => {
    // Arrange
    const repo = createInMemoryIntegrationPolicyRepository();
    await repo.put(policy(true));

    // Act
    const active = await hasEnabledPlannedSessionImportRoute(repo, "p1");

    // Assert
    expect(active).toBe(true);
  });

  it("should be false when the only policy is disabled", async () => {
    // Arrange
    const repo = createInMemoryIntegrationPolicyRepository();
    await repo.put(policy(false));

    // Act
    const active = await hasEnabledPlannedSessionImportRoute(repo, "p1");

    // Assert
    expect(active).toBe(false);
  });

  it("should be false when no policy exists for the profile", async () => {
    // Arrange
    const repo = createInMemoryIntegrationPolicyRepository();

    // Act
    const active = await hasEnabledPlannedSessionImportRoute(repo, "p1");

    // Assert
    expect(active).toBe(false);
  });
});
