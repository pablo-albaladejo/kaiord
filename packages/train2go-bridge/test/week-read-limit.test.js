/**
 * The popup reads this week's plan at most once every 5 minutes, kept only
 * in the worker's memory: a second open within 5 minutes shows the same
 * totals without asking Train2Go, Refresh (`force`) reads again, and nothing
 * of the week reaches chrome.storage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { handleAction, weekReadLimit } = require("../background.js");

const USER_ID = 28035;
const DATE = "2026-04-13";
const FIVE_MINUTES_MS = 5 * 60 * 1_000;

const weekResponse = () => ({
  ok: true,
  status: 200,
  type: "basic",
  redirected: false,
  headers: { get: () => "application/json" },
  text: () =>
    Promise.resolve(JSON.stringify({ data: { replace: { "#workplan": "" } } })),
});

const readWeek = (extra = {}) =>
  handleAction({ action: "read-week", date: DATE, userId: USER_ID, ...extra });

describe("read-week, at most once every 5 minutes", () => {
  beforeEach(() => {
    __resetChromeMock();
    weekReadLimit.clear();
    vi.useFakeTimers({ now: new Date("2026-04-13T08:00:00Z") });
    fetch.mockReset();
    fetch.mockImplementation(async () => weekResponse());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not ask Train2Go again within 5 minutes", async () => {
    // Arrange
    const first = await readWeek();
    vi.advanceTimersByTime(FIVE_MINUTES_MS - 1);

    // Act
    const second = await readWeek();

    // Assert
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("should read again once 5 minutes have passed", async () => {
    // Arrange
    await readWeek();
    vi.advanceTimersByTime(FIVE_MINUTES_MS);

    // Act
    await readWeek();

    // Assert
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should read again when the athlete presses Refresh", async () => {
    // Arrange
    await readWeek();

    // Act
    await readWeek({ force: true });

    // Assert
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should keep the week only in memory, never in chrome.storage", async () => {
    // Arrange

    // Act
    await readWeek();
    await readWeek();

    // Assert
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
