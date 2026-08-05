/**
 * The send control on its own. Whether the watch is reachable at all is
 * `useGarminGate`'s question, and what the screen says about it is
 * `EditorStateRibbon`'s — both have their own suites.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GarminPushButton } from "./GarminPushButton";

const mockState = {
  extensionInstalled: true,
  sessionActive: true,
  pushing: { status: "idle" } as { status: string; message?: string },
  lastError: null as string | null,
  detectExtension: vi.fn(),
  pushWorkout: vi.fn(),
  listWorkouts: vi.fn(),
  setPushing: vi.fn(),
};

const push = vi.fn<() => Promise<boolean>>();

vi.mock("../../../contexts", () => ({
  useGarminBridge: () => ({ ...mockState }),
  useAnalytics: () => ({ event: vi.fn(), pageView: vi.fn() }),
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => undefined,
}));

vi.mock("../../../adapters/dexie/dexie-database", () => ({
  db: { table: () => ({ get: async () => undefined }) },
}));

vi.mock("./useGarminPush", () => ({
  useGarminPush: () => ({ push }),
}));

vi.mock("wouter", () => ({
  useParams: () => ({ id: "workout-1" }),
}));

describe("GarminPushButton", () => {
  beforeEach(() => {
    mockState.pushing = { status: "idle" };
    push.mockReset();
    push.mockResolvedValue(true);
  });

  it("should render the one send verb", () => {
    // Arrange
    render(<GarminPushButton />);

    // Act
    const button = screen.getByTestId("send-to-garmin-button");

    // Assert
    expect(button).not.toBeDisabled();
    expect(button.textContent).toContain("Send to Garmin");
  });

  it("should report the send upward only once the bridge confirms it", async () => {
    // Arrange
    const onSent = vi.fn();
    push.mockResolvedValue(true);
    render(<GarminPushButton onSent={onSent} />);

    // Act
    await userEvent.click(screen.getByTestId("send-to-garmin-button"));

    // Assert
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("should not report a send the bridge rejected", async () => {
    // Arrange
    const onSent = vi.fn();
    push.mockResolvedValue(false);
    render(<GarminPushButton onSent={onSent} />);

    // Act
    await userEvent.click(screen.getByTestId("send-to-garmin-button"));

    // Assert
    expect(onSent).not.toHaveBeenCalled();
  });

  it("should disable the button while the send is in flight", () => {
    // Arrange
    mockState.pushing = { status: "loading" };

    // Act
    render(<GarminPushButton />);

    // Assert
    expect(screen.getByTestId("send-to-garmin-button")).toBeDisabled();
  });

  it("should say the send arrived in words rather than in colour", () => {
    // Arrange
    mockState.pushing = { status: "success" };

    // Act
    render(<GarminPushButton />);

    // Assert
    expect(screen.getByText("On your Garmin")).toBeInTheDocument();
  });

  it("should surface the failure cause", () => {
    // Arrange
    mockState.pushing = { status: "error", message: "Push failed: 403" };

    // Act
    render(<GarminPushButton />);

    // Assert
    expect(screen.getByText("Push failed: 403")).toBeInTheDocument();
  });
});
