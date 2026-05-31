import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { Profile } from "../../types/profile";
import {
  hasEnabledAutoImportZonesPolicy,
  maybeAutoImportZones,
} from "./zones-auto-import";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

const makeProfile = (linked: boolean): Profile => ({
  id: PROFILE_ID,
  name: "P",
  sportZones: {},
  linkedAccounts: linked
    ? [
        {
          source: "train2go",
          externalUserId: "99999",
          externalUserName: "P",
          linkedAt: "2026-04-28T10:00:00.000Z",
        },
      ]
    : [],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

const policy = (over: Partial<IntegrationPolicy>): IntegrationPolicy => ({
  id: "22222222-2222-4222-8222-222222222222",
  profileId: PROFILE_ID,
  dataType: "training-zones",
  bridgeId: "train2go-bridge",
  direction: "import",
  mode: "auto",
  enabled: true,
  updatedAt: "2026-04-28T10:00:00.000Z",
  ...over,
});

describe("hasEnabledAutoImportZonesPolicy", () => {
  it("should return false when no policy exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await hasEnabledAutoImportZonesPolicy(
      persistence,
      PROFILE_ID
    );

    // Assert
    expect(result).toBe(false);
  });

  it("should return true for an enabled auto import policy", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put(policy({}));

    // Act
    const result = await hasEnabledAutoImportZonesPolicy(
      persistence,
      PROFILE_ID
    );

    // Assert
    expect(result).toBe(true);
  });

  it("should return false for a disabled or manual policy", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put(
      policy({ id: "33333333-3333-4333-8333-333333333333", enabled: false })
    );
    await persistence.integrationPolicy.put(
      policy({ id: "44444444-4444-4444-8444-444444444444", mode: "manual" })
    );

    // Act
    const result = await hasEnabledAutoImportZonesPolicy(
      persistence,
      PROFILE_ID
    );

    // Assert
    expect(result).toBe(false);
  });
});

describe("maybeAutoImportZones", () => {
  it("should run the import when linked and an enabled auto policy exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put(policy({}));
    const runImport = vi.fn(async () => undefined);

    // Act
    const fired = await maybeAutoImportZones(
      persistence,
      makeProfile(true),
      PROFILE_ID,
      runImport
    );

    // Assert
    expect(fired).toBe(true);
    expect(runImport).toHaveBeenCalledExactlyOnceWith(PROFILE_ID);
  });

  it("should not run the import when the profile has no Train2Go link", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put(policy({}));
    const runImport = vi.fn(async () => undefined);

    // Act
    const fired = await maybeAutoImportZones(
      persistence,
      makeProfile(false),
      PROFILE_ID,
      runImport
    );

    // Assert
    expect(fired).toBe(false);
    expect(runImport).not.toHaveBeenCalled();
  });

  it("should not run the import when no enabled policy exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const runImport = vi.fn(async () => undefined);

    // Act
    const fired = await maybeAutoImportZones(
      persistence,
      makeProfile(true),
      PROFILE_ID,
      runImport
    );

    // Assert
    expect(fired).toBe(false);
    expect(runImport).not.toHaveBeenCalled();
  });

  it("should swallow import errors and still report dispatched", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put(policy({}));
    const runImport = vi.fn(async () => {
      throw new Error("boom");
    });

    // Act
    const fired = await maybeAutoImportZones(
      persistence,
      makeProfile(true),
      PROFILE_ID,
      runImport
    );

    // Assert
    expect(fired).toBe(true);
    expect(runImport).toHaveBeenCalledOnce();
  });
});
