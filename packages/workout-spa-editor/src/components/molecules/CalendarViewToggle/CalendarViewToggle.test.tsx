import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CalendarViewToggle } from "./CalendarViewToggle";

describe("CalendarViewToggle", () => {
  it("should render 'Switch to list view' + aria-checked=true when current is grid", () => {
    // Arrange

    render(<CalendarViewToggle view="grid" onToggle={vi.fn()} />);

    // Act

    const btn = screen.getByRole("switch", { name: "Switch to list view" });

    // Assert

    expect(btn.getAttribute("aria-checked")).toBe("true");
    expect(btn.getAttribute("title")).toBe("Switch to list view");
  });

  it("should render 'Switch to grid view' + aria-checked=false when current is list", () => {
    // Arrange

    render(<CalendarViewToggle view="list" onToggle={vi.fn()} />);

    // Act

    const btn = screen.getByRole("switch", { name: "Switch to grid view" });

    // Assert

    expect(btn.getAttribute("aria-checked")).toBe("false");
  });

  it("should call onToggle with 'list' when clicked from grid", async () => {
    // Arrange

    const onToggle = vi.fn();
    render(<CalendarViewToggle view="grid" onToggle={onToggle} />);

    // Act

    await userEvent.click(screen.getByTestId("calendar-view-toggle"));

    // Assert

    expect(onToggle).toHaveBeenCalledWith("list");
  });

  it("should call onToggle with 'grid' when clicked from list", async () => {
    // Arrange

    const onToggle = vi.fn();
    render(<CalendarViewToggle view="list" onToggle={onToggle} />);

    // Act

    await userEvent.click(screen.getByTestId("calendar-view-toggle"));

    // Assert

    expect(onToggle).toHaveBeenCalledWith("grid");
  });
});
