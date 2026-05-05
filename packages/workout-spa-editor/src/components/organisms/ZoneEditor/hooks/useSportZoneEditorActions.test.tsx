/* eslint-disable no-magic-numbers -- test fixtures use literal BPM/FTP/zone values for clarity */

/**
 * useSportZoneEditorActions hook tests.
 *
 * Wraps the four zone-mutation use cases with the toast-on-failure
 * surface. Tests use a real in-memory PersistencePort so the use case
 * dispatch is exercised end-to-end; failure modes are induced by
 * passing an unknown profile id (`ProfileNotFoundError` is the
 * canonical async rejection path) and asserting `toast.error` fires.
 */

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PersistenceProvider } from "../../../../contexts/persistence-context";
import {
  ToastContextProvider,
  useToastContext,
} from "../../../../contexts/ToastContext";
import type { PersistencePort } from "../../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import type { Profile } from "../../../../types/profile";
import { ToastProvider } from "../../../atoms/Toast";
import { useSportZoneEditorActions } from "./useSportZoneEditorActions";

const seedProfile = (persistence: PersistencePort, id: string): Profile => {
  const profile: Profile = {
    id,
    name: "Tester",
    sportZones: {
      cycling: {
        thresholds: { ftp: 250, lthr: 180 },
        heartRateZones: {
          method: "custom",
          zones: [{ zone: 1, name: "Z1", minBpm: 100, maxBpm: 130 }],
        },
        powerZones: {
          method: "custom",
          zones: [{ zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 }],
        },
      },
    },
    linkedAccounts: [],
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  };
  void persistence.profiles.put(profile);
  return profile;
};

const wrap = (persistence: PersistencePort) => {
  return ({ children }: { children: ReactNode }) => (
    <ToastProvider>
      <PersistenceProvider persistence={persistence}>
        <ToastContextProvider>{children}</ToastContextProvider>
      </PersistenceProvider>
    </ToastProvider>
  );
};

const renderActions = (
  persistence: PersistencePort,
  profileId: string,
  sport: "cycling" | "running" | "swimming" | "generic" = "cycling"
) => {
  const wrapper = wrap(persistence);

  // Compose actions with the toast context exposed too, so tests can
  // observe failure-path side effects without re-rendering.
  return renderHook(
    () => {
      const actions = useSportZoneEditorActions(profileId, sport);
      const toast = useToastContext();
      return { actions, toast };
    },
    { wrapper }
  );
};

describe("useSportZoneEditorActions - applyMethod", () => {
  it("should persist a method+zones change via setZoneMethod", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = seedProfile(persistence, "p-apply");
    const { result } = renderActions(persistence, profile.id);
    const newZones = [
      { zone: 1, name: "Z1", minPercent: 0, maxPercent: 50 },
      { zone: 2, name: "Z2", minPercent: 51, maxPercent: 75 },
    ];

    // Act
    result.current.actions.applyMethod("powerZones", "british-cycling-6", newZones);

    // Assert
    await waitFor(async () => {
      const updated = await persistence.profiles.getById(profile.id);
      expect(updated?.sportZones?.cycling?.powerZones?.method).toBe(
        "british-cycling-6"
      );
      expect(updated?.sportZones?.cycling?.powerZones?.zones).toStrictEqual(
        newZones
      );
    });
  });

  it("should surface a toast when the underlying use case rejects", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { result } = renderActions(persistence, "missing-id");

    // Act
    result.current.actions.applyMethod("powerZones", "coggan-7", []);

    // Assert
    await waitFor(() => {
      expect(result.current.toast.toasts.length).toBeGreaterThan(0);
    });
    expect(result.current.toast.toasts[0].variant).toBe("error");
  });
});

describe("useSportZoneEditorActions - handleZonesChange", () => {
  it("should replace the zones array and flip method to user via updateSportZones", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = seedProfile(persistence, "p-zones");
    const { result } = renderActions(persistence, profile.id);
    const edited = [
      { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 60 },
    ];

    // Act
    result.current.actions.handleZonesChange("powerZones", edited);

    // Assert
    await waitFor(async () => {
      const updated = await persistence.profiles.getById(profile.id);
      expect(updated?.sportZones?.cycling?.powerZones?.method).toBe("user");
      expect(updated?.sportZones?.cycling?.powerZones?.zones).toStrictEqual(
        edited
      );
    });
  });

  it("should surface a toast when updateSportZones rejects", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { result } = renderActions(persistence, "no-such-profile");

    // Act
    result.current.actions.handleZonesChange("powerZones", []);

    // Assert
    await waitFor(() => {
      expect(result.current.toast.toasts.length).toBeGreaterThan(0);
    });
  });
});

describe("useSportZoneEditorActions - handleAddCustom", () => {
  it("should append a zone via addCustomZone", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = seedProfile(persistence, "p-add");
    const { result } = renderActions(persistence, profile.id);
    const newZone = { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 };

    // Act
    result.current.actions.handleAddCustom("powerZones", newZone);

    // Assert
    await waitFor(async () => {
      const updated = await persistence.profiles.getById(profile.id);
      const zones = updated?.sportZones?.cycling?.powerZones?.zones ?? [];
      expect(zones).toHaveLength(2);
      expect(zones[1]).toStrictEqual(newZone);
    });
  });

  it("should surface a toast when addCustomZone rejects", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { result } = renderActions(persistence, "no-id");

    // Act
    result.current.actions.handleAddCustom("powerZones", { zone: 1, name: "x" });

    // Assert
    await waitFor(() => {
      expect(result.current.toast.toasts.length).toBeGreaterThan(0);
    });
  });
});

describe("useSportZoneEditorActions - handleUpdateThresholds", () => {
  it("should propagate threshold updates via updateSportThresholds", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const profile = seedProfile(persistence, "p-thr");
    const { result } = renderActions(persistence, profile.id);

    // Act
    result.current.actions.handleUpdateThresholds(profile.id, "cycling", {
      ftp: 275,
      lthr: 175,
    });

    // Assert
    await waitFor(async () => {
      const updated = await persistence.profiles.getById(profile.id);
      expect(updated?.sportZones?.cycling?.thresholds.ftp).toBe(275);
      expect(updated?.sportZones?.cycling?.thresholds.lthr).toBe(175);
    });
  });

  it("should surface a toast when updateSportThresholds rejects", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const { result } = renderActions(persistence, "p-thr-fail");

    // Act
    result.current.actions.handleUpdateThresholds("no-id", "cycling", {
      ftp: 200,
    });

    // Assert
    await waitFor(() => {
      expect(result.current.toast.toasts.length).toBeGreaterThan(0);
    });
  });
});
