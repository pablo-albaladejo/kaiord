import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { PushButton } from "./PushButton";

let deferred: { resolve: () => void; promise: Promise<void> };
const pushMock = vi.fn(() => deferred.promise);

vi.mock("../GarminPushButton/useGarminPush", () => ({
  useGarminPush: () => ({ push: pushMock }),
}));

const WORKOUT = { id: "w1" } as unknown as WorkoutRecord;

const makeDeferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { resolve, promise };
};

describe("PushButton", () => {
  beforeEach(() => {
    pushMock.mockClear();
    deferred = makeDeferred();
  });

  it("should render the idle label", () => {
    // Arrange

    // Act

    render(<PushButton workout={WORKOUT} />);

    // Assert

    expect(screen.getByText("Push to Garmin")).toBeInTheDocument();
  });

  it("should transition to pushing then done on click", async () => {
    // Arrange

    render(<PushButton workout={WORKOUT} />);

    // Act

    fireEvent.click(screen.getByText("Push to Garmin"));

    // Assert

    expect(await screen.findByText("Pushing…")).toBeInTheDocument();
    deferred.resolve();
    await waitFor(() => {
      expect(screen.getByText("On your Garmin")).toBeInTheDocument();
    });
  });

  it("should return to idle when the push rejects", async () => {
    // Arrange

    pushMock.mockRejectedValueOnce(new Error("boom"));

    render(<PushButton workout={WORKOUT} />);

    // Act

    fireEvent.click(screen.getByText("Push to Garmin"));

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Push to Garmin")).toBeInTheDocument();
    });
  });
});
