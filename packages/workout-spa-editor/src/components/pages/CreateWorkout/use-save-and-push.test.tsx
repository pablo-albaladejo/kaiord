import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../adapters/dexie/dexie-database";
import { GarminBridgeProvider } from "../../../contexts/garmin-bridge-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { ToastProvider } from "../../atoms/Toast";
import { useSaveAndPush } from "./use-save-and-push";

const RECORD: WorkoutRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  profileId: "p1",
  date: "2026-06-01",
  sport: "cycling",
  source: "ai-generated",
  sourceId: null,
  planId: null,
  state: "structured",
  raw: null,
  krd: {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-05-30T00:00:00.000Z", sport: "cycling" },
    extensions: { structured_workout: { sport: "cycling", steps: [] } },
  },
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: "2026-05-30T00:00:00.000Z",
  modifiedAt: null,
  updatedAt: "2026-05-30T00:00:00.000Z",
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <GarminBridgeProvider>
      <ToastProvider>
        <ToastContextProvider>{children}</ToastContextProvider>
      </ToastProvider>
    </GarminBridgeProvider>
  );
}

describe("useSaveAndPush", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
  });

  it("should persist the built record to the workouts table", async () => {
    // Arrange
    const buildRecord = vi.fn().mockResolvedValue(RECORD);
    const { result } = renderHook(
      () => useSaveAndPush({ buildRecord, onDone: vi.fn() }),
      { wrapper }
    );

    // Act
    await result.current.save();

    // Assert
    const stored = await db.table("workouts").get(RECORD.id);
    expect(stored).toMatchObject({ id: RECORD.id, date: "2026-06-01" });
  });

  it("should pass the persisted record to onDone so callers can route by date", async () => {
    // Arrange
    const onDone = vi.fn();
    const buildRecord = vi.fn().mockResolvedValue(RECORD);
    const { result } = renderHook(
      () => useSaveAndPush({ buildRecord, onDone }),
      {
        wrapper,
      }
    );

    // Act
    await result.current.save();

    // Assert
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledWith(
        expect.objectContaining({ date: "2026-06-01" })
      );
    });
  });
});
