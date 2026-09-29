/**
 * The ribbon's live region (design §3.8): a screen reader hears the
 * headline, the detail and the result message, never the actions or the
 * per-second countdown of a posted attempt's gate.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ExportLedgerEntry } from "../../../types/export-ledger";
import type { GarminGate } from "./use-garmin-gate";

const gate = vi.hoisted(() => ({ current: "ready" as GarminGate }));

const RECORD_ID = "record-1";
const DATE = "2026-10-05";
const MS_BEFORE_GATE = 5_000;

vi.mock("./use-garmin-gate", () => ({
  useGarminGate: () => gate.current,
}));

vi.mock("../../../contexts", () => ({
  useGarminBridge: () => ({
    pushing: { status: "idle" },
    setPushing: vi.fn(),
    sessionActive: true,
  }),
  useAnalytics: () => ({ event: vi.fn(), pageView: vi.fn() }),
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => ({ id: "record-1", date: "2026-10-05" }),
}));

vi.mock("../../../adapters/dexie/dexie-database", () => ({
  db: { table: () => ({ get: async () => undefined }) },
}));

vi.mock("../../../hooks/use-record-lock-held", () => ({
  useRecordLockHeld: () => false,
}));

vi.mock("../../molecules/GarminPushButton/useGarminPush", () => ({
  useGarminPush: () => ({ push: vi.fn() }),
}));

vi.mock("../../molecules/GarminPushButton/useGarminPlacementActions", () => ({
  useGarminPlacementActions: () => ({ confirm: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  useParams: () => ({ id: "record-1" }),
}));

import { EditorStateRibbon } from "./EditorStateRibbon";

const postedRow = (): ExportLedgerEntry =>
  ({
    kaiordRecordId: RECORD_ID,
    placement: {
      kind: "attempting",
      workoutId: "9",
      date: DATE,
      at: new Date(Date.now() - MS_BEFORE_GATE).toISOString(),
      posted: true,
      supersedes: [],
    },
  }) as unknown as ExportLedgerEntry;

describe("EditorStateRibbon", () => {
  it("should keep the actions and the countdown out of every live region", () => {
    // Arrange
    gate.current = "ready";

    // Act
    render(
      <EditorStateRibbon
        state="pushed"
        recordId={RECORD_ID}
        placementRow={postedRow()}
        onSent={vi.fn()}
      />
    );

    // Assert
    const countdown = screen.getByText(/Still checking Garmin/);
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    for (const region of screen.getAllByRole("status")) {
      expect(within(region).queryAllByRole("button")).toEqual([]);
      expect(region.contains(countdown)).toBe(false);
    }
    expect(
      screen.getByRole("status", { name: "Workout delivery status" })
    ).toHaveTextContent(/its calendar date needs you/);
  });

  it("should still announce a broken chain's headline, without its fix", () => {
    // Arrange
    gate.current = "no-extension";

    // Act
    render(<EditorStateRibbon state="ready" onSent={vi.fn()} />);

    // Assert
    const region = screen.getByRole("status", {
      name: "Workout delivery status",
    });
    expect(region).toHaveTextContent(
      /Nothing can reach your watch from this browser/
    );
    expect(within(region).queryAllByRole("button")).toEqual([]);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
