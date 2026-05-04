import { render, screen } from "@testing-library/react";
import { useCallback, useContext, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  defaultFocusTelemetry,
  type FocusTelemetry,
  wiringCanaryEvent,
} from "../store/providers/focus-telemetry";
import {
  FocusTelemetryContext,
  FocusTelemetryProvider,
  useFocusTelemetry,
} from "./focus-telemetry-context";

// Task 2.1.a — FocusTelemetryContext.Provider wraps the editor and exposes
// the current FocusTelemetry via useFocusTelemetry()
describe("FocusTelemetryContext", () => {
  it("should return the defaultFocusTelemetry via useFocusTelemetry when no provider is mounted", () => {
    // Arrange
    let captured: FocusTelemetry | null = null;
    const Probe = () => {
      captured = useFocusTelemetry();
      return null;
    };

    // Act
    render(<Probe />);

    // Assert
    expect(captured).toBe(defaultFocusTelemetry);
  });

  it("should return the provided FocusTelemetry via useFocusTelemetry when a provider is mounted", () => {
    // Arrange
    const spy = vi.fn<FocusTelemetry>();
    let captured: FocusTelemetry | null = null;
    const Probe = () => {
      captured = useFocusTelemetry();
      return null;
    };

    // Act
    render(
      <FocusTelemetryProvider value={spy}>
        <Probe />
      </FocusTelemetryProvider>
    );

    // Assert
    expect(captured).toBe(spy);
  });

  it("should resolve the same value via useContext(FocusTelemetryContext) as useFocusTelemetry", () => {
    // Arrange
    const spy = vi.fn<FocusTelemetry>();
    const fromHook = { current: null as FocusTelemetry | null };
    const fromContext = { current: null as FocusTelemetry | null };

    const Probe = () => {
      fromHook.current = useFocusTelemetry();
      fromContext.current = useContext(FocusTelemetryContext);
      return null;
    };

    // Act
    render(
      <FocusTelemetryProvider value={spy}>
        <Probe />
      </FocusTelemetryProvider>
    );

    // Assert
    expect(fromHook.current).toBe(fromContext.current);
    expect(fromHook.current).toBe(spy);
  });

  it("should keep value reference stable across re-renders when the same function is provided", () => {
    // Arrange
    const observedValues = new Set<FocusTelemetry>();
    let triggerRerender = () => {};

    const Inner = () => {
      observedValues.add(useFocusTelemetry());
      return null;
    };

    const Wrapper = () => {
      const [, setN] = useState(0);
      triggerRerender = () => setN((n) => n + 1);
      const stableFn = useCallback<FocusTelemetry>(() => {}, []);
      return (
        <FocusTelemetryProvider value={stableFn}>
          <Inner />
        </FocusTelemetryProvider>
      );
    };

    render(<Wrapper />);

    // Act
    triggerRerender();
    triggerRerender();

    // Assert
    expect(observedValues.size).toBe(1);
  });

  it("should call the provided telemetry function when a consumer invokes it", () => {
    // Arrange
    const spy = vi.fn<FocusTelemetry>();
    const event = wiringCanaryEvent();

    const Consumer = () => {
      const telemetry = useFocusTelemetry();
      return <button onClick={() => telemetry(event)}>emit</button>;
    };

    render(
      <FocusTelemetryProvider value={spy}>
        <Consumer />
      </FocusTelemetryProvider>
    );

    // Act
    screen.getByRole("button", { name: "emit" }).click();

    // Assert
    expect(spy).toHaveBeenCalledWith(event);
  });
});
