/**
 * The Garmin activities pull's pacing, moved from the extension to the
 * Connector: at most one pull per interval, none while one is in flight,
 * and a retry with backoff for a transient failure of the current
 * extension. The cases are the extension's former ones.
 */
import { describe, expect, it, vi } from "vitest";

import type { ExtensionResponse } from "../../bridge/bridge-transport";
import { createActivitiesPull } from "./garmin-activities-pull";

const feed = (activities: unknown[]): ExtensionResponse => ({
  ok: true,
  protocolVersion: 2,
  data: { activities, disabled: false, throttled: false },
});
const failure = (protocolVersion = 2): ExtensionResponse => ({
  ok: false,
  protocolVersion,
  error: "Request failed: 503",
  status: 503,
});
const MAX_ATTEMPTS = 3;
const THROTTLED = { activities: [], disabled: false, throttled: true };

const pullWith = (
  fetchOnce: () => Promise<ExtensionResponse>,
  at = { now: 0 }
) =>
  createActivitiesPull({
    fetchOnce,
    now: () => at.now,
    sleep: async () => {},
  });

describe("createActivitiesPull", () => {
  it("should return the raw feed on the happy path", async () => {
    // Arrange
    const pull = pullWith(async () => feed([{ activityId: 5 }]));

    // Act
    const res = await pull();

    // Assert
    expect(res.data).toEqual({
      activities: [{ activityId: 5 }],
      disabled: false,
      throttled: false,
    });
  });

  it("should throttle a second pull within the minimum interval", async () => {
    // Arrange
    const at = { now: 1_000 };
    const fetchOnce = vi.fn(async () => feed([]));
    const pull = pullWith(fetchOnce, at);
    await pull();
    at.now += 29_999;

    // Act
    const res = await pull();

    // Assert
    expect(res).toMatchObject({ ok: true, data: THROTTLED });
    expect(fetchOnce).toHaveBeenCalledTimes(1);
  });

  it("should pull again once the interval has passed", async () => {
    // Arrange
    const at = { now: 1_000 };
    const fetchOnce = vi.fn(async () => feed([]));
    const pull = pullWith(fetchOnce, at);
    await pull();
    at.now += 30_000;

    // Act
    await pull();

    // Assert
    expect(fetchOnce).toHaveBeenCalledTimes(2);
  });

  it("should treat an overlapping pull as throttled without a second fetch", async () => {
    // Arrange
    let release: (r: ExtensionResponse) => void = () => {};
    const fetchOnce = vi.fn(
      () => new Promise<ExtensionResponse>((resolve) => (release = resolve))
    );
    const pull = pullWith(fetchOnce);
    const first = pull();

    // Act
    const second = await pull();
    release(feed([]));
    await first;

    // Assert
    expect(second.data).toEqual(THROTTLED);
    expect(fetchOnce).toHaveBeenCalledTimes(1);
  });

  it("should retry a transient failure then return the payload", async () => {
    // Arrange
    const fetchOnce = vi
      .fn<() => Promise<ExtensionResponse>>()
      .mockResolvedValueOnce(failure())
      .mockResolvedValueOnce(feed([{ activityId: 1 }]));
    const pull = pullWith(fetchOnce);

    // Act
    const res = await pull();

    // Assert
    expect(res.ok).toBe(true);
    expect(fetchOnce).toHaveBeenCalledTimes(2);
  });

  it("should give up after all attempts with the last failure", async () => {
    // Arrange
    const fetchOnce = vi.fn(async () => failure());
    const pull = pullWith(fetchOnce);

    // Act
    const res = await pull();

    // Assert
    expect(res).toMatchObject({ ok: false, status: 503 });
    expect(fetchOnce).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it("should not retry an extension one protocol behind, which retries by itself", async () => {
    // Arrange
    const fetchOnce = vi.fn(async () => failure(1));
    const pull = pullWith(fetchOnce);

    // Act
    await pull();

    // Assert
    expect(fetchOnce).toHaveBeenCalledTimes(1);
  });

  it("should not retry a request the extension refused", async () => {
    // Arrange
    const fetchOnce = vi.fn(async () => ({
      ok: false,
      protocolVersion: 2,
      error: "Request not allowed",
      retryable: false,
    }));
    const pull = pullWith(fetchOnce);

    // Act
    await pull();

    // Assert
    expect(fetchOnce).toHaveBeenCalledTimes(1);
  });
});
