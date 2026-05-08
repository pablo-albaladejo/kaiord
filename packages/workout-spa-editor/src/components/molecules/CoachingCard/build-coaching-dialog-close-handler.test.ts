import { describe, expect, it, vi } from "vitest";

import { buildCoachingDialogCloseHandler } from "./build-coaching-dialog-close-handler";

describe("buildCoachingDialogCloseHandler", () => {
  it("should invoke cancelAi before onClose so an in-flight abort lands first", () => {
    // Arrange
    const order: string[] = [];
    const cancelAi = vi.fn(() => {
      order.push("cancelAi");
    });
    const onClose = vi.fn(() => {
      order.push("onClose");
    });

    // Act
    buildCoachingDialogCloseHandler(cancelAi, onClose)();

    // Assert
    expect(cancelAi).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["cancelAi", "onClose"]);
  });

  it("should still invoke onClose when no AI request is in flight (cancelAi is a no-op)", () => {
    // Arrange
    const cancelAi = vi.fn();
    const onClose = vi.fn();

    // Act
    buildCoachingDialogCloseHandler(cancelAi, onClose)();

    // Assert
    expect(cancelAi).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
