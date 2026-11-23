import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setUpdateState } from "../../../lib/service-worker/update-store";
import { render, screen, userEvent } from "../../../test-utils";
import { UpdatePrompt } from "./UpdatePrompt";

const applyUpdate = vi.hoisted(() => vi.fn(async () => "applying" as const));
vi.mock("../../../lib/service-worker/apply-update", () => ({ applyUpdate }));

describe("UpdatePrompt", () => {
  beforeEach(() => {
    applyUpdate.mockClear();
    act(() => setUpdateState("idle"));
  });

  it("should show nothing while no new version is waiting", () => {
    // Arrange

    // Act
    render(<UpdatePrompt />);

    // Assert
    expect(screen.queryByTestId("update-prompt")).not.toBeInTheDocument();
  });

  it("should offer Reload once a new version is waiting, and apply it on click", async () => {
    // Arrange
    render(<UpdatePrompt />);
    act(() => setUpdateState("available"));

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Reload" }));

    // Assert
    expect(screen.getByText("New version available")).toBeInTheDocument();
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it("should ask to save first when unsaved edits blocked the update", () => {
    // Arrange
    render(<UpdatePrompt />);

    // Act
    act(() => setUpdateState("blocked"));

    // Assert
    expect(screen.getByText("Save your changes to update")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeEnabled();
  });
});
