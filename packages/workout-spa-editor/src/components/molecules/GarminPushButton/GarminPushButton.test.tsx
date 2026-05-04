import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GarminPushButton } from "./GarminPushButton";

const mockState = {
  extensionInstalled: false,
  sessionActive: false,
  pushing: { status: "idle" as const },
  lastError: null as string | null,
  detectExtension: vi.fn(),
  pushWorkout: vi.fn(),
  listWorkouts: vi.fn(),
  setPushing: vi.fn(),
};

vi.mock("../../../contexts", () => ({
  useGarminBridge: () => ({ ...mockState }),
  useAnalytics: () => ({ event: vi.fn(), pageView: vi.fn() }),
}));

describe("GarminPushButton", () => {
  beforeEach(() => {
    mockState.extensionInstalled = false;
    mockState.sessionActive = false;
    mockState.pushing = { status: "idle" };
    mockState.lastError = null;
  });

  it("should render nothing when extension is not installed", () => {
    // Arrange

    // Act

    const { container } = render(<GarminPushButton />);

    // Assert

    expect(container.innerHTML).toBe("");
  });

  it("should show disabled button when no session", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = false;

    render(<GarminPushButton />);

    // Act

    const button = screen.getByRole("button");

    // Assert

    expect(button).toBeDisabled();
    expect(button.textContent).toContain("Garmin (no session)");
  });

  it("should show send button when session active", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;

    render(<GarminPushButton />);

    // Act

    const button = screen.getByRole("button");

    // Assert

    expect(button).not.toBeDisabled();
    expect(button.textContent).toContain("Send to Garmin");
  });

  it("should show success feedback", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockState.pushing = { status: "success" };

    // Act

    render(<GarminPushButton />);

    // Assert

    expect(screen.getByText("Sent to Garmin")).toBeInTheDocument();
  });

  it("should show error feedback", () => {
    // Arrange

    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockState.pushing = { status: "error", message: "Push failed" };

    // Act

    render(<GarminPushButton />);

    // Assert

    expect(screen.getByText("Push failed")).toBeInTheDocument();
  });
});
