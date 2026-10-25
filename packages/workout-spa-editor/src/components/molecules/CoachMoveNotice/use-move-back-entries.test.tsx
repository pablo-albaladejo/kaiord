/**
 * The live read of the notice's entries (design §3.9) re-runs when any
 * field of an entry changes, the athlete's day included.
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { OverriddenSession } from "../../../application/coaching/apply-coach-date-moves";
import {
  PROFILE,
  seedSession,
  THU,
  TUE,
} from "../../../application/session-move.test-fixtures";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { useMoveBackEntries } from "./use-move-back-entries";

const WED = "2026-10-07";

describe("useMoveBackEntries", () => {
  it("should re-read when only an entry's athlete day changes", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { date: THU, coachDate: THU },
      match: { date: THU },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PersistenceProvider persistence={persistence}>
        {children}
      </PersistenceProvider>
    );
    const entry = (athleteDate: string): OverriddenSession[] => [
      { workoutId: "w", athleteDate, coachDate: THU },
    ];
    const view = renderHook(
      ({ overridden }) => useMoveBackEntries(PROFILE, overridden),
      { wrapper, initialProps: { overridden: entry(TUE) } }
    );
    await waitFor(() =>
      expect(view.result.current.map((e) => e.athleteDate)).toEqual([TUE])
    );

    // Act
    view.rerender({ overridden: entry(WED) });

    // Assert
    await waitFor(() =>
      expect(view.result.current.map((e) => e.athleteDate)).toEqual([WED])
    );
  });
});
