import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BatchMessage } from "./BatchMessage";

describe("BatchMessage", () => {
  it("should render message text", () => {
    // Arrange

    // Act

    render(
      <BatchMessage message="Processing 3 workouts..." onDismiss={vi.fn()} />
    );

    // Assert

    expect(screen.getByText("Processing 3 workouts...")).toBeInTheDocument();
  });

  it("should call onDismiss when dismiss clicked", async () => {
    // Arrange

    const onDismiss = vi.fn();

    render(<BatchMessage message="Done" onDismiss={onDismiss} />);

    // Act

    await userEvent.click(screen.getByText("Dismiss"));

    // Assert

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
