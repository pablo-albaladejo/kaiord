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
  it("does NOT render when open is false", () => {
    render(
      <ZonesConflictDialog
        open={false}
        conflicts={CONFLICTS}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByTestId("zones-conflict-dialog")).toBeNull();
  });

  it("renders one row per conflict with the static FieldKey label", () => {
    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("FTP")).toBeInTheDocument();
    expect(screen.getByText("Running LTHR")).toBeInTheDocument();
    expect(
      screen.getByTestId("zones-conflict-row-cycling.thresholds.ftp")
    ).toBeInTheDocument();
  });

  it("calls onCancel when the Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("emits all-reject decisions by default when Apply is clicked without changing rows", async () => {
    const onConfirm = vi.fn();
    render(
      <ZonesConflictDialog
        open
        conflicts={CONFLICTS}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.thresholds.ftp": "reject",
      "running.thresholds.lthr": "reject",
    } satisfies Record<FieldKey, ConflictDecision>);
  });

  it("emits per-row accept/reject after the user toggles a row", async () => {
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
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(onConfirm).toHaveBeenCalledWith({
      "cycling.thresholds.ftp": "accept",
      "running.thresholds.lthr": "reject",
    });
  });
});
