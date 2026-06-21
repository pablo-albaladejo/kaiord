import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDeviceId } from "./device-id";

const DEVICE_ID_KEY = "kaiord-sync-device-id";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getDeviceId", () => {
  it("should return the existing id already stored in localStorage", () => {
    // Arrange
    const stored = "11111111-1111-4111-8111-111111111111";
    localStorage.setItem(DEVICE_ID_KEY, stored);

    // Act
    const id = getDeviceId();

    // Assert
    expect(id).toBe(stored);
  });

  it("should create and persist a new id when none is stored", () => {
    // Arrange

    // Act
    const id = getDeviceId();

    // Assert
    expect(id).toMatch(UUID_RE);
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(id);
  });

  it("should return the same id on subsequent calls", () => {
    // Arrange
    const first = getDeviceId();

    // Act
    const second = getDeviceId();

    // Assert
    expect(second).toBe(first);
  });

  it("should fall back to an ephemeral id when storage is unavailable", () => {
    // Arrange
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    // Act
    const id = getDeviceId();

    // Assert
    expect(id).toMatch(UUID_RE);
  });
});
