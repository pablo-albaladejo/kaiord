/**
 * Dexie-backed hook test: a coach mark fires from the SAME guard the keyboard
 * shortcut applies, anchors to an id the focus registry can resolve, and never
 * fires twice for the same profile.
 */
import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import type { Profile } from "../../types/profile";
import type { UserPreferences } from "../../types/user-preferences";
import { useActiveProfileLive } from "../use-active-profile-live";
import { useCoachMark } from "./use-coach-mark";

const hoisted = vi.hoisted(() => ({ store: {} as Record<string, unknown> }));

vi.mock("../../store/selectors", () => ({
  useContextMenuStore: () => hoisted.store,
}));

vi.mock("../../store/clipboard-store", () => ({
  hasClipboardContent: () => false,
}));

const PROFILE_ID = "44444444-4444-4444-4444-444444444444";

const STEP_A = { id: "step-a", stepIndex: 0 };
const STEP_B = { id: "step-b", stepIndex: 1 };
// `repeatCount` + `steps` is what `isRepetitionBlock` discriminates on.
const BLOCK = { id: "block-1", repeatCount: 2, steps: [] };

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Coach Mark Rider",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const setStore = (overrides: Record<string, unknown>): void => {
  hoisted.store = {
    currentWorkout: {
      extensions: { structured_workout: { steps: [STEP_A, STEP_B, BLOCK] } },
    },
    selectedStepId: null,
    selectedStepIds: [],
    selectStep: vi.fn(),
    clearStepSelection: vi.fn(),
    deleteStep: vi.fn(),
    copyStep: vi.fn(),
    pasteStep: vi.fn(),
    openCreateBlockDialog: vi.fn(),
    ungroupRepetitionBlock: vi.fn(),
    selectAllSteps: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    reorderStep: vi.fn(),
    ...overrides,
  };
};

const TABLES = ["profiles", "meta", "userPreferences"];

const clearTables = async (): Promise<void> => {
  for (const table of TABLES) await db.table(table).clear();
};

const seedProfile = async (
  dismissedCoachMarks?: ReadonlyArray<string>
): Promise<void> => {
  await db.table<Profile>("profiles").put(PROFILE);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
  if (dismissedCoachMarks) {
    await db.table<UserPreferences>("userPreferences").put({
      profileId: PROFILE_ID,
      calendarView: "grid",
      dismissedCoachMarks: [...dismissedCoachMarks],
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
  }
};

const SELECTED_PAIR = {
  selectedStepId: "step-b",
  selectedStepIds: ["step-a", "step-b"],
};

/**
 * The mark itself is derived from the store and resolves synchronously, but
 * `dismiss`/`accept` cannot write until the active profile has hydrated from
 * Dexie. Probing both keeps those assertions from racing the live query.
 */
const renderProbe = () =>
  renderHook(() => ({
    coach: useCoachMark(),
    profileId: useActiveProfileLive()?.id ?? null,
  }));

describe("useCoachMark", () => {
  beforeEach(async () => {
    await clearTables();
    setStore({});
  });
  afterEach(clearTables);

  it("should stay silent while no editor command is available", async () => {
    // Arrange
    await seedProfile();

    // Act
    const { result } = renderHook(() => useCoachMark());

    // Assert
    await waitFor(() => expect(result.current.mark).toBeNull());
  });

  it("should fire the grouping mark once two steps are selected", async () => {
    // Arrange
    await seedProfile();
    setStore(SELECTED_PAIR);

    // Act
    const { result } = renderHook(() => useCoachMark());

    // Assert
    await waitFor(() => expect(result.current.mark?.id).toBe("create-block"));
  });

  it("should anchor the grouping mark to the last selected step", async () => {
    // Arrange
    await seedProfile();
    setStore(SELECTED_PAIR);

    // Act
    const { result } = renderHook(() => useCoachMark());

    // Assert
    await waitFor(() => expect(result.current.mark?.anchorId).toBe("step-b"));
  });

  it("should anchor the ungroup mark to the selected block", async () => {
    // Arrange
    await seedProfile();
    setStore({ selectedStepId: "block-1", selectedStepIds: [] });

    // Act
    const { result } = renderHook(() => useCoachMark());

    // Assert
    await waitFor(() => {
      expect(result.current.mark?.id).toBe("ungroup-block");
      expect(result.current.mark?.anchorId).toBe("block-1");
    });
  });

  it("should stay silent for a mark the profile already dismissed", async () => {
    // Arrange
    await seedProfile(["create-block"]);
    setStore(SELECTED_PAIR);

    // Act
    const { result } = renderHook(() => useCoachMark());

    // Assert
    await waitFor(() => expect(result.current.mark).toBeNull());
  });

  it("should persist the dismissal when the mark is waved away", async () => {
    // Arrange
    await seedProfile();
    setStore(SELECTED_PAIR);
    const { result } = renderProbe();
    await waitFor(() => expect(result.current.profileId).toBe(PROFILE_ID));

    // Act
    result.current.coach.dismiss();

    // Assert
    await waitFor(async () => {
      const row = await db
        .table<UserPreferences>("userPreferences")
        .get(PROFILE_ID);
      expect(row?.dismissedCoachMarks).toEqual(["create-block"]);
    });
  });

  it("should run the underlying editor command when accepted", async () => {
    // Arrange
    await seedProfile();
    const openCreateBlockDialog = vi.fn();
    setStore({ ...SELECTED_PAIR, openCreateBlockDialog });
    const { result } = renderProbe();
    await waitFor(() => expect(result.current.profileId).toBe(PROFILE_ID));

    // Act
    result.current.coach.accept();

    // Assert
    expect(openCreateBlockDialog).toHaveBeenCalled();
  });

  it("should retire the mark it just ran", async () => {
    // Arrange
    await seedProfile();
    setStore(SELECTED_PAIR);
    const { result } = renderProbe();
    await waitFor(() => expect(result.current.profileId).toBe(PROFILE_ID));

    // Act
    result.current.coach.accept();

    // Assert
    await waitFor(async () => {
      const row = await db
        .table<UserPreferences>("userPreferences")
        .get(PROFILE_ID);
      expect(row?.dismissedCoachMarks).toContain("create-block");
    });
  });
});
