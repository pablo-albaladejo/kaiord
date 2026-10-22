import type { PendingAction } from "@kaiord/ai";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PendingActionCard } from "./PendingActionCard";

const renderCard = (deferredCount?: number) => {
  const action: PendingAction = {
    toolCallId: "call-1",
    toolName: "sync_coaching",
    input: {},
    ...(deferredCount !== undefined && { deferredCount }),
  };
  return render(
    <PendingActionCard
      action={action}
      onApprove={vi.fn()}
      onDeny={vi.fn()}
      busy={false}
    />
  );
};

describe("PendingActionCard deferred actions", () => {
  it.each([
    [1, "The assistant proposed 1 more action; it may ask you about it next."],
    [
      2,
      "The assistant proposed 2 more actions; it may ask you about them next.",
    ],
  ])(
    "should say %i other proposed action may be asked about next",
    (count, line) => {
      // Arrange
      const deferred = count;

      // Act
      renderCard(deferred);

      // Assert
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  );

  it("should say nothing about other actions when none were deferred", () => {
    // Arrange
    const deferred = undefined;

    // Act
    renderCard(deferred);

    // Assert
    expect(screen.queryByText(/more action/)).toBeNull();
  });
});
