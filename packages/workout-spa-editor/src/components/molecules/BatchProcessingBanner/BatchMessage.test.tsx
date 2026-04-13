import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BatchMessage } from "./BatchMessage";

describe("BatchMessage", () => {
  it("renders message text", () => {
    render(
      <BatchMessage message="Processing 3 workouts..." onDismiss={vi.fn()} />
    );

    expect(screen.getByText("Processing 3 workouts...")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss clicked", async () => {
    const onDismiss = vi.fn();

    render(<BatchMessage message="Done" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByText("Dismiss"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
