import type { MutableRefObject, Ref } from "react";
import { describe, expect, it, vi } from "vitest";

import { mergeRefs } from "./merge-refs";

const NODE = "node-value";

describe("mergeRefs", () => {
  it("should assign the node to an object ref's current", () => {
    // Arrange
    const objectRef: MutableRefObject<string | null> = { current: null };

    // Act
    mergeRefs(objectRef)(NODE);

    // Assert
    expect(objectRef.current).toBe(NODE);
  });

  it("should call a function ref with the node", () => {
    // Arrange
    const fnRef = vi.fn();

    // Act
    mergeRefs<string>(fnRef)(NODE);

    // Assert
    expect(fnRef).toHaveBeenCalledWith(NODE);
  });

  it("should skip null and undefined refs without throwing", () => {
    // Arrange
    const refs: Array<Ref<string> | undefined> = [null, undefined];

    // Act
    const act = () => mergeRefs<string>(...refs)(NODE);

    // Assert
    expect(act).not.toThrow();
  });

  it("should fan the node out to every ref at once", () => {
    // Arrange
    const objectRef: MutableRefObject<string | null> = { current: null };
    const fnRef = vi.fn();

    // Act
    mergeRefs<string>(objectRef, fnRef)(NODE);

    // Assert
    expect(objectRef.current).toBe(NODE);
    expect(fnRef).toHaveBeenCalledWith(NODE);
  });

  it("should propagate a null node on unmount", () => {
    // Arrange
    const objectRef: MutableRefObject<string | null> = { current: NODE };
    const fnRef = vi.fn();

    // Act
    mergeRefs<string>(objectRef, fnRef)(null);

    // Assert
    expect(objectRef.current).toBeNull();
    expect(fnRef).toHaveBeenCalledWith(null);
  });
});
