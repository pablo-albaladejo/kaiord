import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

  it("renders nothing when extension is not installed", () => {
    const { container } = render(<GarminPushButton />);

    expect(container.innerHTML).toBe("");
  });

  it("shows disabled button when no session", () => {
    mockState.extensionInstalled = true;
    mockState.sessionActive = false;

    render(<GarminPushButton />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.textContent).toContain("Garmin (no session)");
  });

  it("shows send button when session active", () => {
    mockState.extensionInstalled = true;
    mockState.sessionActive = true;

    render(<GarminPushButton />);

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button.textContent).toContain("Send to Garmin");
  });

  it("shows success feedback", () => {
    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockState.pushing = { status: "success" };

    render(<GarminPushButton />);

    expect(screen.getByText("Sent to Garmin")).toBeInTheDocument();
  });

  it("shows error feedback", () => {
    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockState.pushing = { status: "error", message: "Push failed" };

    render(<GarminPushButton />);

    expect(screen.getByText("Push failed")).toBeInTheDocument();
  });
});
