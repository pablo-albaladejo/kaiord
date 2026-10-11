import { afterEach, describe, expect, it, vi } from "vitest";

const loadModule = async () => {
  vi.resetModules();
  return import("./leave-tracking");
};

const beforeUnloadCalls = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.filter(([type]) => type === "beforeunload").length;

describe("trackLeaveDuring", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should listen for beforeunload only while the import is pending", async () => {
    // Arrange
    const { trackLeaveDuring } = await loadModule();
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    let resolve: (value: string) => void = () => undefined;

    // Act
    const tracked = trackLeaveDuring(
      () => new Promise<string>((r) => (resolve = r))
    );
    const addedWhilePending = beforeUnloadCalls(add);
    resolve("page");
    const result = await tracked;

    // Assert
    expect(result).toBe("page");
    expect(addedWhilePending).toBe(1);
    expect(beforeUnloadCalls(remove)).toBe(1);
  });

  it("should stop listening when the import rejects", async () => {
    // Arrange
    const { trackLeaveDuring } = await loadModule();
    const remove = vi.spyOn(window, "removeEventListener");
    const failure = new Error("error loading dynamically imported module");

    // Act
    const outcome = trackLeaveDuring(() => Promise.reject(failure));

    // Assert
    await expect(outcome).rejects.toBe(failure);
    expect(beforeUnloadCalls(remove)).toBe(1);
  });

  it("should keep one listener for overlapping imports", async () => {
    // Arrange
    const { trackLeaveDuring } = await loadModule();
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    let resolveFirst: () => void = () => undefined;
    const first = trackLeaveDuring(
      () => new Promise<void>((r) => (resolveFirst = r))
    );

    // Act
    await trackLeaveDuring(() => Promise.resolve());
    const removedBeforeFirstSettles = beforeUnloadCalls(remove);
    resolveFirst();
    await first;

    // Assert
    expect(beforeUnloadCalls(add)).toBe(1);
    expect(removedBeforeFirstSettles).toBe(0);
    expect(beforeUnloadCalls(remove)).toBe(1);
  });

  it("should ignore a beforeunload when no import is pending", async () => {
    // Arrange
    const { isLeaving } = await loadModule();

    // Act
    window.dispatchEvent(new Event("beforeunload", { cancelable: true }));

    // Assert
    expect(isLeaving()).toBe(false);
  });

  it("should clear the leave when the page is shown again", async () => {
    // Arrange
    const { isLeaving, trackLeaveDuring } = await loadModule();
    void trackLeaveDuring(() => new Promise<never>(() => undefined));
    window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
    const markedBeforeShow = isLeaving();

    // Act
    window.dispatchEvent(new Event("pageshow"));

    // Assert
    expect(markedBeforeShow).toBe(true);
    expect(isLeaving()).toBe(false);
  });
});
