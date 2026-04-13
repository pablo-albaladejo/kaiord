import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { EmptyDayDialog } from "./EmptyDayDialog";

function renderWithRouter(ui: React.ReactNode, path = "/calendar") {
  const loc = memoryLocation({ path, record: true });
  return {
    ...render(<Router hook={loc.hook}>{ui}</Router>),
    location: loc,
  };
}

describe("EmptyDayDialog", () => {
  it("renders dialog when date is provided (open)", () => {
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    expect(screen.getByTestId("empty-day-dialog")).toBeInTheDocument();
    expect(screen.getByText("Add workout")).toBeInTheDocument();
  });

  it("does not render dialog content when date is null (closed)", () => {
    renderWithRouter(<EmptyDayDialog date={null} onClose={vi.fn()} />);

    expect(screen.queryByTestId("empty-day-dialog")).not.toBeInTheDocument();
  });

  it("shows formatted date label", () => {
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    expect(screen.getByText(/Saturday, March 15/)).toBeInTheDocument();
  });

  it("renders Add from Library button", () => {
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    expect(screen.getByText("Add from Library")).toBeInTheDocument();
  });

  it("renders Create new workout button", () => {
    renderWithRouter(<EmptyDayDialog date="2025-03-15" onClose={vi.fn()} />);

    expect(screen.getByText("Create new workout")).toBeInTheDocument();
  });

  it("navigates to library and closes on Add from Library click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { location } = renderWithRouter(
      <EmptyDayDialog date="2025-03-15" onClose={onClose} />
    );

    await user.click(screen.getByText("Add from Library"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(location.history).toContain("/library");
  });

  it("navigates to new workout with date and closes on Create click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { location } = renderWithRouter(
      <EmptyDayDialog date="2025-03-15" onClose={onClose} />
    );

    await user.click(screen.getByText("Create new workout"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(location.history).toContain("/workout/new?date=2025-03-15");
  });
});
