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

const HookConsumerDialog = ({ dialogOpen }: { dialogOpen: boolean }) => {
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
      {dialogOpen && (
        <div
          role="dialog"
          data-state="open"
          data-radix-popper-content-wrapper=""
        />
      )}
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
    it("emits fallback=empty-state when an item target falls back to the empty-state button", () => {
      // Arrange: no currentWorkout → firstItemId=null → item ghost falls to empty-state
      const spy = vi.fn<FocusTelemetry>();
      withTelemetry(spy, <HookConsumer />);

      // Act
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("ghost")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const fallbacks = eventsOfType(spy, "unresolved-target-fallback");
      expect(fallbacks).toHaveLength(1);
      expect(fallbacks[0][0]).toEqual({
        type: "unresolved-target-fallback",
        targetKind: "item",
        fallback: "empty-state",
      });
    });

    it("emits fallback=first-item when an item target falls back to the first registered item", () => {
      // Arrange: currentWorkout has one step so firstItemId is "first-id";
      // "first-id" is registered; "unknown" is not
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

      // Act: request unknown id → fallback to first registered item
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("unknown")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const fallbacks = eventsOfType(spy, "unresolved-target-fallback");
      expect(fallbacks).toHaveLength(1);
      expect(fallbacks[0][0]).toMatchObject({
        type: "unresolved-target-fallback",
        targetKind: "item",
        fallback: "first-item",
      });
    });

    it("emits fallback=heading when an item target falls all the way to the heading", () => {
      // Arrange: no empty-state button, no first item → only heading remains
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

      // Act
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("ghost")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const fallbacks = eventsOfType(spy, "unresolved-target-fallback");
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
    it("emits exactly one event for 5 short-circuits within 500ms", () => {
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

      // Act: 5 short-circuits with different targets, each 50ms apart (total 250ms)
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

      // Assert
      const shortCircuits = eventsOfType(spy, "form-field-short-circuit");
      expect(shortCircuits).toHaveLength(1);
    });

    it("emits a second event after the 1000ms debounce window expires", () => {
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

      // First short-circuit
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("x")));
      });

      // Advance past the 1000ms debounce window
      vi.advanceTimersByTime(1100);

      // Second short-circuit
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("y")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const shortCircuits = eventsOfType(spy, "form-field-short-circuit");
      expect(shortCircuits).toHaveLength(2);
    });
  });

  // 3.3.a ----------------------------------------------------------------
  describe("overlay-deferred-apply", () => {
    it("emits deferredForMs quantized to 100ms buckets after overlay closes", async () => {
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

      // Add dialog to DOM directly so the MO detects count=1
      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("data-state", "open");
      dialog.setAttribute("data-radix-popper-content-wrapper", "");
      root.appendChild(dialog);
      // Flush MO microtasks (jsdom fires MO as microtasks)
      await new Promise<void>((r) => queueMicrotask(r));
      await new Promise<void>((r) => queueMicrotask(r));

      // Stash target while overlay is open (performance.now = T0)
      act(() => {
        useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
      });

      // Advance fake clock by 250ms → performance.now = T0+250
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // Close dialog → MO fires → rAF fires (mocked) → emit + apply
      await act(async () => {
        dialog.remove();
        await new Promise<void>((r) => queueMicrotask(r));
        await new Promise<void>((r) => queueMicrotask(r));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const events = eventsOfType(spy, "overlay-deferred-apply");
      expect(events).toHaveLength(1);
      const { deferredForMs } = events[0][0] as {
        type: string;
        deferredForMs: number;
      };
      // 250ms → Math.round(250/100)*100 = 300ms
      expect(deferredForMs).toBe(300);
      expect(deferredForMs % 100).toBe(0);

      rafSpy.mockRestore();
    });
  });

  // 3.4.a ----------------------------------------------------------------
  describe("wiring-canary", () => {
    it("fires exactly once on first editor mount with a custom telemetry function", () => {
      const spy = vi.fn<FocusTelemetry>();
      withTelemetry(spy, <HookConsumer />);

      const canaries = eventsOfType(spy, "wiring-canary");
      expect(canaries).toHaveLength(1);
    });

    it("does not fire on a second mount in the same session", () => {
      const spy1 = vi.fn<FocusTelemetry>();
      const { unmount } = withTelemetry(spy1, <HookConsumer />);
      unmount();
      document.body.innerHTML = "";

      const spy2 = vi.fn<FocusTelemetry>();
      withTelemetry(spy2, <HookConsumer />);

      const canaries2 = eventsOfType(spy2, "wiring-canary");
      expect(canaries2).toHaveLength(0);
    });

    it("fires again after __resetCanaryForTests resets the session flag", () => {
      const spy1 = vi.fn<FocusTelemetry>();
      const { unmount } = withTelemetry(spy1, <HookConsumer />);
      unmount();
      document.body.innerHTML = "";
      __resetCanaryForTests();

      const spy2 = vi.fn<FocusTelemetry>();
      withTelemetry(spy2, <HookConsumer />);

      const canaries2 = eventsOfType(spy2, "wiring-canary");
      expect(canaries2).toHaveLength(1);
    });
  });

  // 3.5.a ----------------------------------------------------------------
  describe("focus-error", () => {
    it("emits { phase: focus } when el.focus() throws", () => {
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

      // Act
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("bad-item")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const errors = eventsOfType(spy, "focus-error");
      expect(errors).toHaveLength(1);
      expect(errors[0][0]).toEqual({ type: "focus-error", phase: "focus" });
    });

    it("emits { phase: scrollIntoView } when scrollIntoView throws", () => {
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

      // Act
      act(() => {
        useWorkoutStore
          .getState()
          .setPendingFocusTarget(focusItem(asItemId("scroll-item")));
      });
      act(() => {
        vi.runAllTimers();
      });

      // Assert
      const errors = eventsOfType(spy, "focus-error");
      expect(errors).toHaveLength(1);
      expect(errors[0][0]).toEqual({
        type: "focus-error",
        phase: "scrollIntoView",
      });
    });
  });
});
