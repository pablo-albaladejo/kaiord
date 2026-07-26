/**
 * Snapshot-push allowlist behaviour. Only garmin/train2go vendored the
 * `profile-snapshot` handler, so any other discovered bridge must receive
 * neither a snapshot nor a clear — sending would burn its 60/h budget on an
 * action it answers with "unknown action".
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "../types/profile";
import { useActiveProfileLive } from "./use-active-profile-live";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useProfileSnapshotPush } from "./use-profile-snapshot-push";
import type * as SnapshotHelpers from "./use-profile-snapshot-push-helpers";
import { sendClear, sendSnapshot } from "./use-profile-snapshot-push-helpers";

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: vi.fn(),
}));
vi.mock("./use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));
// Keeps the real `pickActiveSport`; only the two send paths are observed.
vi.mock("./use-profile-snapshot-push-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof SnapshotHelpers>();
  return {
    ...actual,
    sendSnapshot: vi.fn().mockResolvedValue(undefined),
    sendClear: vi.fn().mockResolvedValue(undefined),
  };
});

const mockedActiveProfile = vi.mocked(useActiveProfileLive);
const mockedUseDiscoveredBridges = vi.mocked(useDiscoveredBridges);
const mockedSendSnapshot = vi.mocked(sendSnapshot);
const mockedSendClear = vi.mocked(sendClear);

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const CYCLING_FTP_W = 270;
const FIXED_NOW = "2026-05-01T08:30:00.000Z";

const profile: Profile = {
  id: PROFILE_ID,
  name: "Pablo",
  sportZones: {
    cycling: {
      thresholds: { ftp: CYCLING_FTP_W },
      heartRateZones: { method: "manual", zones: [] },
      powerZones: { method: "manual", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW,
};

const GARMIN: DiscoveredBridge = {
  bridgeId: "garmin-bridge",
  extensionId: "ext-garmin",
};
const TRAIN2GO: DiscoveredBridge = {
  bridgeId: "train2go-bridge",
  extensionId: "ext-t2g",
};
const WHOOP: DiscoveredBridge = {
  bridgeId: "whoop-bridge",
  extensionId: "ext-whoop",
};
const TANITA: DiscoveredBridge = {
  bridgeId: "tanita-bridge",
  extensionId: "ext-tanita",
};

const pushedExtensionIds = () =>
  mockedSendSnapshot.mock.calls.map((c) => c[0].extensionId);

describe("useProfileSnapshotPush", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should push only to snapshot-capable bridges and skip the others", async () => {
    // Arrange
    mockedActiveProfile.mockReturnValue({ id: PROFILE_ID, profile });
    mockedUseDiscoveredBridges.mockReturnValue([
      GARMIN,
      WHOOP,
      TRAIN2GO,
      TANITA,
    ]);

    // Act
    renderHook(() => useProfileSnapshotPush());

    // Assert
    await waitFor(() => {
      expect(mockedSendSnapshot).toHaveBeenCalled();
    });
    expect(pushedExtensionIds().sort()).toEqual(["ext-garmin", "ext-t2g"]);
  });

  it("should push nothing at all when only non-capable bridges are discovered", async () => {
    // Arrange
    mockedActiveProfile.mockReturnValue({ id: PROFILE_ID, profile });
    mockedUseDiscoveredBridges.mockReturnValue([WHOOP, TANITA]);

    // Act
    renderHook(() => useProfileSnapshotPush());

    // Assert
    expect(mockedSendSnapshot).not.toHaveBeenCalled();
  });

  it("should clear only snapshot-capable bridges when the active profile is deleted", async () => {
    // Arrange
    mockedActiveProfile.mockReturnValue({ id: PROFILE_ID, profile });
    mockedUseDiscoveredBridges.mockReturnValue([GARMIN, WHOOP]);
    const { rerender } = renderHook(() => useProfileSnapshotPush());
    await waitFor(() => {
      expect(mockedSendSnapshot).toHaveBeenCalled();
    });

    // Act
    mockedActiveProfile.mockReturnValue({ id: null, profile: null });
    rerender();

    // Assert
    await waitFor(() => {
      expect(mockedSendClear).toHaveBeenCalledTimes(1);
    });
    expect(mockedSendClear.mock.calls[0]?.[0].extensionId).toBe("ext-garmin");
  });
});
