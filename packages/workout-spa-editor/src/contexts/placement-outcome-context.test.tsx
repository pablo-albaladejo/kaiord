import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { PlacementResult } from "../application/garmin-placement/placement-result";
import {
  PlacementOutcomeProvider,
  usePlacementOutcome,
} from "./placement-outcome-context";

const OUTDATED: PlacementResult = {
  kind: "library-only",
  reason: "bridge-outdated",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <PlacementOutcomeProvider>{children}</PlacementOutcomeProvider>
);

describe("usePlacementOutcome", () => {
  it("should keep a record's outcome after the control that set it unmounts", () => {
    // Arrange
    const { result } = renderHook(
      () => ({
        sender: usePlacementOutcome("record-1"),
        reader: usePlacementOutcome("record-1"),
        other: usePlacementOutcome("record-2"),
      }),
      { wrapper }
    );

    // Act
    act(() => result.current.sender[1](OUTDATED));

    // Assert
    expect(result.current.reader[0]).toEqual(OUTDATED);
    expect(result.current.other[0]).toBeUndefined();
  });

  it("should forget an outcome once cleared", () => {
    // Arrange
    const { result } = renderHook(() => usePlacementOutcome("record-1"), {
      wrapper,
    });
    act(() => result.current[1](OUTDATED));

    // Act
    act(() => result.current[1](undefined));

    // Assert
    expect(result.current[0]).toBeUndefined();
  });

  it("should fall back to local state outside a provider", () => {
    // Arrange
    const { result } = renderHook(() => usePlacementOutcome("record-1"));

    // Act
    act(() => result.current[1](OUTDATED));

    // Assert
    expect(result.current[0]).toEqual(OUTDATED);
  });
});
