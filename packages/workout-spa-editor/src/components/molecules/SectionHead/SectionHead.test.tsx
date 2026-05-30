import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SectionHead } from "./SectionHead";

describe("SectionHead", () => {
  it("should render the title", () => {
    // Arrange

    render(<SectionHead title="Training Load" />);

    // Act

    const heading = screen.getByRole("heading", { name: "Training Load" });

    // Assert

    expect(heading).toBeInTheDocument();
  });

  it("should render the action button and call onAction on click", async () => {
    // Arrange

    const onAction = vi.fn();
    render(
      <SectionHead title="Weekly Stats" action="See all" onAction={onAction} />
    );

    // Act

    await userEvent.click(screen.getByRole("button", { name: "See all" }));

    // Assert

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("should omit the action button when action is not provided", () => {
    // Arrange

    render(<SectionHead title="No Action" />);

    // Act

    const button = screen.queryByRole("button");

    // Assert

    expect(button).not.toBeInTheDocument();
  });
});
