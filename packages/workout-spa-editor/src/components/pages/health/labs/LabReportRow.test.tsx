import type { LabReport } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LabReportRow } from "./LabReportRow";

const report: LabReport = {
  id: "r1",
  profileId: "p1",
  date: "2026-03-05",
  labName: "Quest",
  provenance: { source: "manual" },
};

const renderRow = (onDelete: () => void, onToggle = () => {}) =>
  render(
    <ul>
      <LabReportRow
        report={report}
        isSelected={false}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </ul>
  );

describe("LabReportRow", () => {
  it("should require confirmation before deleting (F3.4)", async () => {
    // Arrange
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderRow(onDelete);

    // Act
    await user.click(screen.getByRole("button", { name: /Delete report/ }));

    // Assert
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("should call onDelete after confirming", async () => {
    // Arrange
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderRow(onDelete);
    await user.click(screen.getByRole("button", { name: /Delete report/ }));

    // Act
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should abandon the delete on cancel", async () => {
    // Arrange
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderRow(onDelete);
    await user.click(screen.getByRole("button", { name: /Delete report/ }));

    // Act
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /Delete report/ })
    ).toBeInTheDocument();
  });

  it("should toggle the review open via the date button", async () => {
    // Arrange
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderRow(() => {}, onToggle);

    // Act
    await user.click(screen.getByText("2026-03-05"));

    // Assert
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
