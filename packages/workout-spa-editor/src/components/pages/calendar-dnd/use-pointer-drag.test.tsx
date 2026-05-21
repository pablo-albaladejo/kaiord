import { act, render, screen } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePointerDrag } from "./use-pointer-drag";

const DESKTOP_MATCHES = (): MediaQueryList => ({
  matches: true,
  media: "(min-width: 768px)",
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

const setMatchMedia = (matches: boolean): void => {
  const impl = (): MediaQueryList => ({
    ...DESKTOP_MATCHES(),
    matches,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: impl,
  });
};

const stubElementFromPoint = (day: string | null): void => {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => {
      if (!day) return null;
      const node = document.createElement("div");
      node.setAttribute("data-day", day);
      return node;
    },
  });
};

type HarnessProps = {
  onDrop: (workoutId: string, targetDayISO: string) => void;
};

function Harness({ onDrop }: HarnessProps) {
  const { bind, activeWorkoutId, dropTargetId } = usePointerDrag({ onDrop });
  return (
    <div>
      <button
        type="button"
        data-testid="card-w1"
        onPointerDown={bind("w1") as unknown as (e: ReactPointerEvent) => void}
      >
        Card
      </button>
      <span data-testid="active">{activeWorkoutId ?? ""}</span>
      <span data-testid="target">{dropTargetId ?? ""}</span>
    </div>
  );
}

const firePointerUp = (clientX: number, clientY: number): void => {
  const event = new Event("pointerup") as Event & {
    clientX: number;
    clientY: number;
  };
  Object.defineProperty(event, "clientX", { value: clientX });
  Object.defineProperty(event, "clientY", { value: clientY });
  window.dispatchEvent(event);
};

describe("usePointerDrag", () => {
  beforeEach(() => {
    setMatchMedia(true);
    stubElementFromPoint("2026-04-09");
  });

  it("should call onDrop with the workoutId and target day on pointerup over a drop target", () => {
    // Arrange
    const onDrop = vi.fn();
    render(<Harness onDrop={onDrop} />);
    const card = screen.getByTestId("card-w1");

    // Act
    act(() => {
      card.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
        })
      );
    });
    act(() => {
      firePointerUp(100, 100);
    });

    // Assert
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith("w1", "2026-04-09");
  });

  it("should not register any drag when viewport is below 768px", () => {
    // Arrange
    setMatchMedia(false);
    const onDrop = vi.fn();
    render(<Harness onDrop={onDrop} />);
    const card = screen.getByTestId("card-w1");

    // Act
    act(() => {
      card.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
        })
      );
    });
    act(() => {
      firePointerUp(100, 100);
    });

    // Assert
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("should not fire onDrop when pointerup lands outside a drop target", () => {
    // Arrange
    const onDrop = vi.fn();
    render(<Harness onDrop={onDrop} />);
    const card = screen.getByTestId("card-w1");
    stubElementFromPoint(null);

    // Act
    act(() => {
      card.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
        })
      );
    });
    act(() => {
      firePointerUp(100, 100);
    });

    // Assert
    expect(onDrop).not.toHaveBeenCalled();
  });
});
