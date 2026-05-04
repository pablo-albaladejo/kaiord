import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DensityToggle } from "./DensityToggle";

describe("DensityToggle", () => {
  it("renders 'Switch to comfortable view' + aria-checked=true when current is compact", () => {
    render(<DensityToggle density="compact" onToggle={vi.fn()} />);

    const btn = screen.getByRole("switch", {
      name: "Switch to comfortable view",
    });
    expect(btn.getAttribute("aria-checked")).toBe("true");
    expect(btn.getAttribute("title")).toBe("Switch to comfortable view");
  });

  it("renders 'Switch to compact view' + aria-checked=false when current is comfortable", () => {
    render(<DensityToggle density="comfortable" onToggle={vi.fn()} />);

    const btn = screen.getByRole("switch", { name: "Switch to compact view" });
    expect(btn.getAttribute("aria-checked")).toBe("false");
  });

  it("should call onToggle with the next density when clicked", async () => {
    const onToggle = vi.fn();
    render(<DensityToggle density="compact" onToggle={onToggle} />);

    await userEvent.click(screen.getByTestId("density-toggle"));

    expect(onToggle).toHaveBeenCalledWith("comfortable");
  });

  it("calls onToggle with 'compact' when current is comfortable", async () => {
    const onToggle = vi.fn();
    render(<DensityToggle density="comfortable" onToggle={onToggle} />);

    await userEvent.click(screen.getByTestId("density-toggle"));

    expect(onToggle).toHaveBeenCalledWith("compact");
  });
});
