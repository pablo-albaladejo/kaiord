import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DensityToggle } from "./DensityToggle";

describe("DensityToggle", () => {
  it("should render 'Switch to comfortable view' + aria-checked=true when current is compact", () => {
    // Arrange

    render(<DensityToggle density="compact" onToggle={vi.fn()} />);

    // Act

    const btn = screen.getByRole("switch", {
      name: "Switch to comfortable view",
    });

    // Assert

    expect(btn.getAttribute("aria-checked")).toBe("true");
    expect(btn.getAttribute("title")).toBe("Switch to comfortable view");
  });

  it("should render 'Switch to compact view' + aria-checked=false when current is comfortable", () => {
    // Arrange

    render(<DensityToggle density="comfortable" onToggle={vi.fn()} />);

    // Act

    const btn = screen.getByRole("switch", { name: "Switch to compact view" });

    // Assert

    expect(btn.getAttribute("aria-checked")).toBe("false");
  });

  it("should call onToggle with the next density when clicked", async () => {
    // Arrange

    const onToggle = vi.fn();
    render(<DensityToggle density="compact" onToggle={onToggle} />);

    // Act

    await userEvent.click(screen.getByTestId("density-toggle"));

    // Assert

    expect(onToggle).toHaveBeenCalledWith("comfortable");
  });

  it("should call onToggle with 'compact' when current is comfortable", async () => {
    // Arrange

    const onToggle = vi.fn();
    render(<DensityToggle density="comfortable" onToggle={onToggle} />);

    // Act

    await userEvent.click(screen.getByTestId("density-toggle"));

    // Assert

    expect(onToggle).toHaveBeenCalledWith("compact");
  });
});
