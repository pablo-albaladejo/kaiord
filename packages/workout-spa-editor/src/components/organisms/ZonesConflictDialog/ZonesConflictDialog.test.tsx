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

  it("should render a band-level conflict as a single group row with band-count summary (5.2a)", () => {
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
    // group row uses the new testid; per-band row exists in the DOM
    // (inside collapsed Detail) but is hidden via aria-hidden.
    expect(
      screen.getByTestId("zones-conflict-group-cycling.heartRateZones")
    ).toBeInTheDocument();
    expect(screen.getByText("Cycling HR Zones")).toBeInTheDocument();
    expect(screen.getByText("1 band differs")).toBeInTheDocument();
    expect(
      screen.getByTestId("zones-conflict-row-cycling.heartRateZones.z2.maxBpm")
    ).toBeInTheDocument();
  });

  it("should preserve insertion order grouping scalars first then band groups (5.2b)", () => {
    // Arrange
    // mixed scalar + band conflicts; scalar (LTHR) first. FTP would couple
    // with cycling.powerZones — use cycling.thresholds.lthr to avoid the
    // FTP+power coupling and test pure ordering.
    const mixed: ConflictItem[] = [
      { field: "cycling.thresholds.lthr", current: 160, incoming: 174 },
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

    // Assert
    // scalar keeps its per-row testid; bands collapse into one group.
    expect(
      screen.getByTestId("zones-conflict-row-cycling.thresholds.lthr")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("zones-conflict-group-cycling.heartRateZones")
    ).toBeInTheDocument();
    expect(screen.getByText("2 bands differ")).toBeInTheDocument();
  });

  it("should emit accept decisions for all bands when the group's accept radio is selected (5.2c)", async () => {
    // Arrange
    // 4 conflicts in cycling.heartRateZones; user clicks ONCE on the
    // group's accept radio (NOT 4 individual radios).
    const tableConflicts: ConflictItem[] = [
      {
        field: "cycling.heartRateZones.z1.minBpm",
        current: 100,
        incoming: 107,
      },
      {
        field: "cycling.heartRateZones.z1.maxBpm",
        current: 130,
        incoming: 133,
      },
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
    const onConfirm = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={tableConflicts}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    const group = screen.getByTestId(
      "zones-conflict-group-cycling.heartRateZones"
    );
    const acceptInput = group.querySelector(
      'input[value="accept"]'
    ) as HTMLInputElement;
    await userEvent.click(acceptInput);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    // Assert
    // single group click emits accept for all 4 band-bound keys.
    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.heartRateZones.z1.minBpm": "accept",
      "cycling.heartRateZones.z1.maxBpm": "accept",
      "cycling.heartRateZones.z2.minBpm": "accept",
      "cycling.heartRateZones.z2.maxBpm": "accept",
    });
  });

  it("should couple FTP scalar + cycling.powerZones into a single group (5.2d / D-MA6)", async () => {
    // Arrange
    // FTP scalar conflict alongside cycling-power band conflicts SHALL
    // render as one coupled group, not separate.
    const coupled: ConflictItem[] = [
      { field: "cycling.thresholds.ftp", current: 200, incoming: 268 },
      {
        field: "cycling.powerZones.z4.minPercent",
        current: 91,
        incoming: 90,
      },
      {
        field: "cycling.powerZones.z4.maxPercent",
        current: 105,
        incoming: 100,
      },
    ];
    const onConfirm = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={coupled}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    const coupledGroup = screen.getByTestId(
      "zones-conflict-group-cycling.threshold-and-zones"
    );
    const ftpRow = screen.getByTestId(
      "zones-conflict-row-cycling.thresholds.ftp"
    );

    // Act
    // accept the coupled group; both FTP and bands should be in the decisions.
    const acceptInput = coupledGroup.querySelector(
      'input[value="accept"]'
    ) as HTMLInputElement;
    await userEvent.click(acceptInput);
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    // Assert
    // coupled group exists; the FTP row testid lives INSIDE the coupled
    // group's Detail view (per the spec — Detail keeps all rows in DOM
    // via aria-hidden), NOT as a standalone scalar row.
    expect(coupledGroup).toBeInTheDocument();
    expect(screen.getByText("Cycling threshold + zones")).toBeInTheDocument();
    expect(coupledGroup.contains(ftpRow)).toBe(true);
    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.thresholds.ftp": "accept",
      "cycling.powerZones.z4.minPercent": "accept",
      "cycling.powerZones.z4.maxPercent": "accept",
    });
  });
});
