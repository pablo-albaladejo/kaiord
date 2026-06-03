/**
 * §9.3 — `useImportOnLoad` dispatches a parsed KRD by type.
 *
 * Health KRDs route to `importHealthFitFile` and navigate to the
 * matching Health Hub page. Workout KRDs keep the existing flow
 * (workout-load + optional date-aware persistence). Unsupported
 * health payloads surface as a toast and do NOT navigate.
 */
import type { KRD } from "@kaiord/core";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import type { PersistencePort } from "../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { ToastProvider } from "../../atoms/Toast";
import { useImportOnLoad } from "./use-import-on-load";

const ACTIVE_PROFILE_ID = "p-active";
const NEGATIVE_ASSERT_DELAY_MS = 50;

const makeSleepKrd = (): KRD => ({
  version: "2.0",
  type: "sleep_record",
  metadata: { created: "2026-05-23T07:00:00.000Z" },
  extensions: {
    health: {
      sleep: {
        kind: "sleep",
        version: "2.0",
        startTime: "2026-05-23T22:00:00.000Z",
        endTime: "2026-05-24T06:00:00.000Z",
        stages: [],
      },
    },
  },
});

const makeWorkoutKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-05-23T07:00:00.000Z", sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps: [] } },
});

const setupPersistence = async (): Promise<PersistencePort> => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.setActiveId(ACTIVE_PROFILE_ID);
  return persistence;
};

const makeWrapper =
  (
    persistence: PersistencePort,
    hook: ReturnType<typeof memoryLocation>["hook"]
  ) =>
  ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      <ToastProvider>
        <ToastContextProvider>
          <Router hook={hook}>{children}</Router>
        </ToastContextProvider>
      </ToastProvider>
    </PersistenceProvider>
  );

vi.mock("../../../hooks/useAppHandlers", () => ({
  useAppHandlers: () => ({
    handleFileLoad: vi.fn(),
    handleFileError: vi.fn(),
  }),
}));

describe("useImportOnLoad (§9.3 dispatch)", () => {
  it("should navigate to /health/sleep after importing a sleep KRD", async () => {
    // Arrange
    const persistence = await setupPersistence();
    const { hook, history } = memoryLocation({
      path: "/workout/new",
      record: true,
    });
    const { result } = renderHook(() => useImportOnLoad(null), {
      wrapper: makeWrapper(persistence, hook),
    });

    // Act
    result.current(makeSleepKrd());

    // Assert
    await waitFor(() => {
      expect(history[history.length - 1]).toBe("/health/sleep");
    });
  });

  it("should NOT persist an imported workout when the date is calendar-impossible", async () => {
    // Arrange
    const persistence = await setupPersistence();
    const { hook, history } = memoryLocation({
      path: "/workout/new",
      record: true,
    });
    const { result } = renderHook(() => useImportOnLoad("2026-13-45"), {
      wrapper: makeWrapper(persistence, hook),
    });

    // Act
    result.current(makeWorkoutKrd());

    // Assert
    await new Promise((resolve) =>
      setTimeout(resolve, NEGATIVE_ASSERT_DELAY_MS)
    );
    const stored = await persistence.workouts.getByDateRange(
      "2000-01-01",
      "2100-01-01"
    );
    expect(stored).toHaveLength(0);
    expect(history.some((p) => /^\/workout\/[0-9a-f-]+$/.test(p))).toBe(false);
  });
});
