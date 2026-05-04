/**
 * ZonesConflictDialog — render + accept/reject/cancel paths.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
} from "../../../types/coaching-zones";
import { ZonesConflictDialog } from "./ZonesConflictDialog";

const CONFLICTS: ConflictItem[] = [
  { field: "cycling.thresholds.ftp", current: 200, incoming: 270 },
  { field: "running.thresholds.lthr", current: 150, incoming: 168 },
];

describe("ZonesConflictDialog", () => {
  it("should do NOT render when open is false", () => {
    // Arrange

    // Act

    render(
      <ZonesConflictDialog
        open={false}
        conflicts={CONFLICTS}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.queryByTestId("zones-conflict-dialog")).toBeNull();
  });

  it("should render one row per conflict with the static FieldKey label", () => {
    // Arrange

    // Act

    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByText("FTP")).toBeInTheDocument();
    expect(screen.getByText("Running LTHR")).toBeInTheDocument();
    expect(
      screen.getByTestId("zones-conflict-row-cycling.thresholds.ftp")
    ).toBeInTheDocument();
  });

  it("should call onCancel when the Cancel button is clicked", async () => {
    // Arrange

    const onCancel = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Act

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should emit all-reject decisions by default when Apply is clicked without changing rows", async () => {
    // Arrange

    const onConfirm = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    // Act

    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    // Assert

    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.thresholds.ftp": "reject",
      "running.thresholds.lthr": "reject",
    } satisfies Record<FieldKey, ConflictDecision>);
  });

  it("should emit per-row accept/reject after the user toggles a row", async () => {
    // Arrange

    const onConfirm = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const ftpRow = screen.getByTestId(
      "zones-conflict-row-cycling.thresholds.ftp"
    );
    const acceptFtp = ftpRow.querySelector(
      'input[value="accept"]'
    ) as HTMLInputElement;
    await userEvent.click(acceptFtp);

    // Act

    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    // Assert

    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.thresholds.ftp": "accept",
      "running.thresholds.lthr": "reject",
    });
  });

  it("should render a band-level conflict row with a generated label (5.2a)", () => {
    // Arrange
    const bandConflicts: ConflictItem[] = [
      {
        field: "cycling.heartRateZones.z2.maxBpm",
        current: 145,
        incoming: 147,
      },
    ];

    // Act
    render(
      <ZonesConflictDialog
        open
        conflicts={bandConflicts}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByTestId("zones-conflict-row-cycling.heartRateZones.z2.maxBpm")
    ).toBeInTheDocument();
    expect(screen.getByText("Cycling HR Z2 max")).toBeInTheDocument();
  });

  it("should preserve insertion order grouping scalars and band-level conflicts (5.2b)", () => {
    // Arrange — mixed scalar + band conflicts, scalar first
    const mixed: ConflictItem[] = [
      { field: "cycling.thresholds.ftp", current: 200, incoming: 270 },
      {
        field: "cycling.heartRateZones.z2.minBpm",
        current: 131,
        incoming: 134,
      },
      {
        field: "cycling.heartRateZones.z2.maxBpm",
        current: 145,
        incoming: 147,
      },
    ];

    // Act
    render(
      <ZonesConflictDialog
        open
        conflicts={mixed}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert — all three rows render with distinct testids
    expect(
      screen.getByTestId("zones-conflict-row-cycling.thresholds.ftp")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("zones-conflict-row-cycling.heartRateZones.z2.minBpm")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("zones-conflict-row-cycling.heartRateZones.z2.maxBpm")
    ).toBeInTheDocument();
  });

  it("should emit accept decisions for all rows of a sport-kind table when each is toggled (5.2c)", async () => {
    // Arrange
    const tableConflicts: ConflictItem[] = [
      { field: "cycling.heartRateZones.z1.minBpm", current: 100, incoming: 107 },
      { field: "cycling.heartRateZones.z1.maxBpm", current: 130, incoming: 133 },
      { field: "cycling.heartRateZones.z2.minBpm", current: 131, incoming: 134 },
      { field: "cycling.heartRateZones.z2.maxBpm", current: 145, incoming: 147 },
    ];
    const onConfirm = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={tableConflicts}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    for (const c of tableConflicts) {
      const row = screen.getByTestId(`zones-conflict-row-${c.field}`);
      const acceptInput = row.querySelector(
        'input[value="accept"]'
      ) as HTMLInputElement;
      await userEvent.click(acceptInput);
    }

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    // Assert
    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.heartRateZones.z1.minBpm": "accept",
      "cycling.heartRateZones.z1.maxBpm": "accept",
      "cycling.heartRateZones.z2.minBpm": "accept",
      "cycling.heartRateZones.z2.maxBpm": "accept",
    });
  });
});
