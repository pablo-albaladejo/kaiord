/**
 * The detail hands its Garmin state the session's lock (AC-29): a done
 * session never offers Update Garmin.
 */
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  coachWorkout,
  seedSession,
} from "../../../application/session-move.test-fixtures";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { DetailGarminDrift } from "./DetailGarminDrift";

const noticeProps = vi.fn();

vi.mock("../../molecules/GarminDriftBadge/GarminDriftNotice", () => ({
  GarminDriftNotice: (props: { locked: boolean }) => {
    noticeProps(props);
    return null;
  },
}));

const renderFor = async (seed: Parameters<typeof seedSession>[0]) => {
  const persistence = await seedSession(seed);
  render(
    <PersistenceProvider persistence={persistence}>
      <DetailGarminDrift record={coachWorkout()} placementRow={undefined} />
    </PersistenceProvider>
  );
};

const lastLocked = () => noticeProps.mock.lastCall?.[0].locked;

describe("DetailGarminDrift", () => {
  beforeEach(() => {
    noticeProps.mockClear();
  });

  it("should leave a movable session open once its movability is read", async () => {
    // Arrange
    const seed = {};

    // Act
    await renderFor(seed);

    // Assert
    expect(noticeProps.mock.calls[0][0].locked).toBe(true);
    await waitFor(() => expect(lastLocked()).toBe(false));
  });

  it("should lock a session the coach marked completed", async () => {
    // Arrange
    const seed = { activity: { status: "completed" as const } };

    // Act
    await renderFor(seed);

    // Assert
    await waitFor(() =>
      expect(noticeProps.mock.calls.length).toBeGreaterThan(1)
    );
    expect(lastLocked()).toBe(true);
  });
});
