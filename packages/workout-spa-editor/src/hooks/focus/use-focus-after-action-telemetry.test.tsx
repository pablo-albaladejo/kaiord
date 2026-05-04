/**
 * Telemetry emission tests for `useFocusAfterAction` (tasks 3.1.a–3.5.a).
 * These tests FAIL until Phase C wiring (tasks 3.1.b–3.5.b).
 */
import { act, render } from "@testing-library/react";
import { useContext, useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FocusRegistryContext,
  FocusRegistryProvider,
} from "../../contexts/focus-registry-context";
import { FocusTelemetryContext } from "../../contexts/focus-telemetry-context";
import { __resetOverlayObserverForTests } from "../../lib/focus/overlay-observer";
import {
  focusEmptyState,
  focusItem,
} from "../../store/focus/focus-target.types";
import type {
  FocusTelemetry,
  FocusTelemetryEvent,
} from "../../store/providers/focus-telemetry";
import { asItemId } from "../../store/providers/item-id";
import { useWorkoutStore } from "../../store/workout-store";
import { useFocusAfterAction } from "./use-focus-after-action";
import { __resetCanaryForTests } from "./use-focus-telemetry-emitter";

const resetStore = () => {
  useWorkoutStore.setState({
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    deletedSteps: [],
    pendingFocusTarget: null,
  });
};

const eventsOfType = (
  spy: ReturnType<typeof vi.fn>,
  type: FocusTelemetryEvent["type"]
) => spy.mock.calls.filter(([e]: [FocusTelemetryEvent]) => e.type === type);

const HookConsumer = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const emptyStateRef = useRef<HTMLButtonElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  useFocusAfterAction({
    editorRootRef: rootRef,
    emptyStateButtonRef: emptyStateRef,
    editorHeadingRef: headingRef,
  });
  return (
    <div ref={rootRef} data-testid="editor-root">
      <h2 ref={headingRef} tabIndex={-1}>
        Editor
      </h2>
      <button ref={emptyStateRef}>Add step</button>
    </div>
  );
};

const withTelemetry = (spy: FocusTelemetry, ui: React.ReactElement) =>
  render(
    <FocusTelemetryContext.Provider value={spy}>
      <FocusRegistryProvider>{ui}</FocusRegistryProvider>
    </FocusTelemetryContext.Provider>
  );

describe("useFocusAfterAction — telemetry", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    __resetCanaryForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    __resetOverlayObserverForTests();
    resetStore();
    document.body.innerHTML = "";
  });

  // 3.1.a ----------------------------------------------------------------
  describe("unresolved-target-fallback", () => {
    it("should emit fallback=empty-state when an item target falls back to the empty-state button", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      withTelemetry(spy, <HookConsumer />);
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("ghost")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const fallbacks = eventsOfType(spy, "unresolved-target-fallback");

      // Assert
      expect(fallbacks).toHaveLength(1);
      expect(fallbacks[0][0]).toEqual({
        type: "unresolved-target-fallback",
        targetKind: "item",
        fallback: "empty-state",
      });
    });

    it("should emit fallback=first-item when an item target falls back to the first registered item", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const ItemRegistrant = ({ id }: { id: string }) => {
        const ctx = useContext(FocusRegistryContext);
        const ref = useRef<HTMLDivElement | null>(null);
        useEffect(() => {
          const el = ref.current;
          if (!el) return;
          ctx.registerItem(asItemId(id), el);
          return () => ctx.unregisterItem(asItemId(id), el);
        }, [id, ctx]);
        return <div ref={ref} tabIndex={-1} />;
      };
      useWorkoutStore.setState({
        currentWorkout: {
          version: "1.0",
          type: "structured_workout",
          metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
          extensions: {
            structured_workout: {
              name: "W",
              sport: "running",
              steps: [{ stepIndex: 0, id: "first-id" } as never],
            },
          },
        },
      });
      withTelemetry(
        spy,
        <>
          <HookConsumer />
          <ItemRegistrant id="first-id" />
        </>
      );
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("unknown")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const fallbacks = eventsOfType(spy, "unresolved-target-fallback");

      // Assert
      expect(fallbacks).toHaveLength(1);
      expect(fallbacks[0][0]).toMatchObject({
        type: "unresolved-target-fallback",
        targetKind: "item",
        fallback: "first-item",
      });
    });

    it("should emit fallback=heading when an item target falls all the way to the heading", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const HeadingOnlyConsumer = () => {
        const rootRef = useRef<HTMLDivElement | null>(null);
        const emptyRef = useRef<HTMLButtonElement | null>(null);
        const headingRef = useRef<HTMLHeadingElement | null>(null);
        useFocusAfterAction({
          editorRootRef: rootRef,
          emptyStateButtonRef: emptyRef,
          editorHeadingRef: headingRef,
        });
        return (
          <div ref={rootRef}>
            <h2 ref={headingRef} tabIndex={-1}>
              Editor
            </h2>
          </div>
        );
      };
      withTelemetry(spy, <HeadingOnlyConsumer />);
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("ghost")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const fallbacks = eventsOfType(spy, "unresolved-target-fallback");

      // Assert
      expect(fallbacks).toHaveLength(1);
      expect(fallbacks[0][0]).toMatchObject({
        type: "unresolved-target-fallback",
        targetKind: "item",
        fallback: "heading",
      });
    });
  });

  // 3.2.a ----------------------------------------------------------------
  describe("form-field-short-circuit", () => {
    it("should emit exactly one event for 5 short-circuits within 500ms", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const { baseElement } = withTelemetry(spy, <HookConsumer />);
      const root = baseElement.querySelector(
        "[data-testid='editor-root']"
      ) as HTMLDivElement;
      const input = document.createElement("input");
      input.type = "text";
      root.appendChild(input);
      input.focus();
      for (const id of ["a", "b", "c", "d", "e"]) {
        act(() => {
          useWorkoutStore
            .getState()
            .setPendingFocusTarget(focusItem(asItemId(id)));
        });
        vi.advanceTimersByTime(50);
      }
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const shortCircuits = eventsOfType(spy, "form-field-short-circuit");

      // Assert
      expect(shortCircuits).toHaveLength(1);
    });

    it("should emit a second event after the 1000ms debounce window expires", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const { baseElement } = withTelemetry(spy, <HookConsumer />);
      const root = baseElement.querySelector(
        "[data-testid='editor-root']"
      ) as HTMLDivElement;
      const input = document.createElement("input");
      input.type = "text";
      root.appendChild(input);
      input.focus();
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("x")));
      });
      vi.advanceTimersByTime(1100);
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("y")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const shortCircuits = eventsOfType(spy, "form-field-short-circuit");

      // Assert
      expect(shortCircuits).toHaveLength(2);
    });
  });

  // 3.3.a ----------------------------------------------------------------
  describe("overlay-deferred-apply", () => {
    it("should emit deferredForMs quantized to 100ms buckets after overlay closes", async () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const rafSpy = vi
        .spyOn(globalThis, "requestAnimationFrame")
        .mockImplementation((cb) => {
          cb(0);
          return 0;
        });
      const { baseElement } = withTelemetry(spy, <HookConsumer />);
      const root = baseElement.querySelector(
        "[data-testid='editor-root']"
      ) as HTMLElement;
      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("data-state", "open");
      dialog.setAttribute("data-radix-popper-content-wrapper", "");
      root.appendChild(dialog);
      await new Promise<void>((r) => queueMicrotask(r));
      await new Promise<void>((r) => queueMicrotask(r));
      act(() => {
        useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
      });
      act(() => {
        vi.advanceTimersByTime(250);
      });
      await act(async () => {
        dialog.remove();
        await new Promise<void>((r) => queueMicrotask(r));
        await new Promise<void>((r) => queueMicrotask(r));
      });
      act(() => {
        vi.runAllTimers();
      });
      const events = eventsOfType(spy, "overlay-deferred-apply");
      expect(events).toHaveLength(1);
      const { deferredForMs } = events[0][0] as {
        type: string;
        deferredForMs: number;
      };
      expect(deferredForMs).toBe(300);
      expect(deferredForMs % 100).toBe(0);

      // Act
      rafSpy.mockRestore();

      // Assert
    });
  });

  // 3.4.a ----------------------------------------------------------------
  describe("wiring-canary", () => {
    it("should fire exactly once on first editor mount with a custom telemetry function", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      withTelemetry(spy, <HookConsumer />);

      // Act
      const canaries = eventsOfType(spy, "wiring-canary");

      // Assert
      expect(canaries).toHaveLength(1);
    });

    it("should not fire on a second mount in the same session", () => {
      // Arrange
      const spy1 = vi.fn<FocusTelemetry>();
      const { unmount } = withTelemetry(spy1, <HookConsumer />);
      unmount();
      document.body.innerHTML = "";
      const spy2 = vi.fn<FocusTelemetry>();
      withTelemetry(spy2, <HookConsumer />);

      // Act
      const canaries2 = eventsOfType(spy2, "wiring-canary");

      // Assert
      expect(canaries2).toHaveLength(0);
    });

    it("should fire again after __resetCanaryForTests resets the session flag", () => {
      // Arrange
      const spy1 = vi.fn<FocusTelemetry>();
      const { unmount } = withTelemetry(spy1, <HookConsumer />);
      unmount();
      document.body.innerHTML = "";
      __resetCanaryForTests();
      const spy2 = vi.fn<FocusTelemetry>();
      withTelemetry(spy2, <HookConsumer />);

      // Act
      const canaries2 = eventsOfType(spy2, "wiring-canary");

      // Assert
      expect(canaries2).toHaveLength(1);
    });
  });

  // 3.5.a ----------------------------------------------------------------
  describe("focus-error", () => {
    it("should emit { phase: focus } when el.focus() throws", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const ThrowingItem = ({ id }: { id: string }) => {
        const ctx = useContext(FocusRegistryContext);
        const ref = useRef<HTMLDivElement | null>(null);
        useEffect(() => {
          const el = ref.current;
          if (!el) return;
          vi.spyOn(el, "focus").mockImplementation(() => {
            throw new Error("detached");
          });
          ctx.registerItem(asItemId(id), el);
          return () => ctx.unregisterItem(asItemId(id), el);
        }, [id, ctx]);
        return <div ref={ref} tabIndex={-1} />;
      };
      withTelemetry(
        spy,
        <>
          <HookConsumer />
          <ThrowingItem id="bad-item" />
        </>
      );
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("bad-item")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const errors = eventsOfType(spy, "focus-error");

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0][0]).toEqual({ type: "focus-error", phase: "focus" });
    });

    it("should emit { phase: scrollIntoView } when scrollIntoView throws", () => {
      // Arrange
      const spy = vi.fn<FocusTelemetry>();
      const ThrowingScrollItem = ({ id }: { id: string }) => {
        const ctx = useContext(FocusRegistryContext);
        const ref = useRef<HTMLDivElement | null>(null);
        useEffect(() => {
          const el = ref.current;
          if (!el) return;
          vi.spyOn(el, "focus").mockImplementation(() => {});
          el.scrollIntoView = () => {
            throw new TypeError("legacy scrollIntoView");
          };
          ctx.registerItem(asItemId(id), el);
          return () => ctx.unregisterItem(asItemId(id), el);
        }, [id, ctx]);
        return <div ref={ref} tabIndex={-1} />;
      };
      withTelemetry(
        spy,
        <>
          <HookConsumer />
          <ThrowingScrollItem id="scroll-item" />
        </>
      );
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("scroll-item")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Act
      const errors = eventsOfType(spy, "focus-error");

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0][0]).toEqual({
        type: "focus-error",
        phase: "scrollIntoView",
      });
    });
  });
});
