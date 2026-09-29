import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AthleteZonesProvider } from "../../../contexts/athlete-zones-context";
import { profileWith } from "../../../lib/athlete/test-profile";
import type { KRD } from "../../../types/krd";
import type { Profile } from "../../../types/profile";
import { exportWorkout } from "../../../utils/export-workout";
import { useSaveWorkout } from "./use-save-workout";

vi.mock("../../../utils/export-workout");

const FTP_W = 250;

const cyclingKrd = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Sweet spot", sport: "cycling", steps: [] },
  },
} as unknown as KRD;

const withProfile =
  (profile: Profile | null) =>
  ({ children }: { children: ReactNode }) => (
    <AthleteZonesProvider profile={profile}>{children}</AthleteZonesProvider>
  );

const exportFtpArg = () => vi.mocked(exportWorkout).mock.calls[0]?.[3];

describe("useSaveWorkout", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should export with the FTP of the page's active profile for the workout's sport", async () => {
    // Arrange
    vi.mocked(exportWorkout).mockResolvedValue(new Uint8Array());
    const profile = profileWith("cycling", { ftp: FTP_W });
    const { result } = renderHook(() => useSaveWorkout(cyclingKrd), {
      wrapper: withProfile(profile),
    });

    // Act
    await act(async () => {
      await result.current.handleSave();
    });

    // Assert
    expect(exportFtpArg()).toBe(FTP_W);
  });

  it("should export with no FTP while the page's profile is not loaded", async () => {
    // Arrange
    vi.mocked(exportWorkout).mockResolvedValue(new Uint8Array());
    const { result } = renderHook(() => useSaveWorkout(cyclingKrd), {
      wrapper: withProfile(null),
    });

    // Act
    await act(async () => {
      await result.current.handleSave();
    });

    // Assert
    expect(exportFtpArg()).toBeUndefined();
  });
});
