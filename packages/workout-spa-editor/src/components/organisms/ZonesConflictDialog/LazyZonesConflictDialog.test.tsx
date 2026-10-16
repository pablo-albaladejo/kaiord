import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ConflictItem } from "../../../types/coaching-zones";
import { LazyZonesConflictDialog } from "./LazyZonesConflictDialog";

const CONFLICTS: ConflictItem[] = [
  { field: "cycling.thresholds.ftp", current: 200, incoming: 270 },
];

const dialog = (open: boolean) => (
  <LazyZonesConflictDialog
    open={open}
    conflicts={CONFLICTS}
    onConfirm={vi.fn()}
    onCancel={vi.fn()}
  />
);

describe("LazyZonesConflictDialog", () => {
  it("should render nothing before the first open", () => {
    // Arrange

    // Act
    const { container } = render(dialog(false));

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should keep a decision across a close and a reopen", async () => {
    // Arrange
    const { rerender } = render(dialog(true));
    await userEvent.click(
      await screen.findByRole("radio", { name: "Keep current" })
    );

    // Act
    rerender(dialog(false));
    rerender(dialog(true));

    // Assert
    expect(
      await screen.findByRole("radio", { name: "Keep current" })
    ).toBeChecked();
  });
});
