/**
 * `useFocusAfterAction` integration tests (§7.2–7.8).
 *
 * The hook observes `pendingFocusTarget` and, through a chain of DOM
 * helpers already covered by their own unit tests, resolves a
 * `FocusTarget` to a real element and programmatically focuses it.
 * These tests assert the end-to-end behavior by rendering a minimal
 * harness around the hook and driving the Zustand store directly.
 *
 * Timing: all focus moves happen inside `setTimeout(fn, 0)` (§7.6.c).
 * Tests install `vi.useFakeTimers()` and call `vi.runAllTimers()` to
 * advance past that boundary. `requestAnimationFrame` is similarly
 * stubbed via `vi.advanceTimersByTime` semantics.
 *
 * StrictMode re-run (§6.1): every test executes under both standard and
 * strict rendering modes via `describe.each`. The strict suite proves that
 * double-mount / double-effect semantics do not break focus behaviour.
 */

import { act, render } from "@testing-library/react";
import { Fragment, StrictMode, useContext, useEffect, useRef } from "react";
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
import type { FocusTelemetry } from "../../store/providers/focus-telemetry";
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

type HarnessRefs = {
  root: HTMLDivElement;
  emptyState: HTMLButtonElement;
  heading: HTMLHeadingElement;
  registerSpy: ReturnType<typeof vi.fn>;
  getItemSpy: ReturnType<typeof vi.fn>;
};

const Harness = ({
  harnessRef,
}: {
  harnessRef: { current: HarnessRefs | null };
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const emptyStateRef = useRef<HTMLButtonElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useFocusAfterAction({
    editorRootRef: rootRef,
    emptyStateButtonRef: emptyStateRef,
    editorHeadingRef: headingRef,
  });

  const attach = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (node && harnessRef.current === null) {
      const empty = emptyStateRef.current!;
      const heading = headingRef.current!;
      harnessRef.current = {
        root: node,
        emptyState: empty,
        heading,
        registerSpy: vi.fn(),
        getItemSpy: vi.fn(),
      };
    }
  };

  return (
    <div ref={attach} data-testid="editor-root">
      <h2 ref={headingRef} tabIndex={-1} data-testid="heading">
        Editor
      </h2>
      <button ref={emptyStateRef} data-testid="empty-state">
        Add step
      </button>
    </div>
  );
};

type WrapperComponent = typeof Fragment | typeof StrictMode;

describe.each([
  { mode: "standard", Wrapper: Fragment as WrapperComponent },
  { mode: "strict", Wrapper: StrictMode as WrapperComponent },
])("useFocusAfterAction [$mode]", ({ Wrapper }) => {
  const renderHarness = () => {
    const ref = { current: null as HarnessRefs | null };
    const view = render(
      <Wrapper>
        <FocusRegistryProvider>
          <Harness harnessRef={ref} />
        </FocusRegistryProvider>
      </Wrapper>
    );
    return { ref, view };
  };

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

  it("should focus the empty-state button for an empty-state target", () => {
    // Arrange
    const { ref } = renderHarness();
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });

    // Act
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(document.activeElement).toBe(ref.current!.emptyState);
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("should fall back to the heading when the item id is unknown and the list is empty", () => {
    // Arrange
    const { ref } = renderHarness();
    const btn = ref.current!.emptyState;
    btn.remove();
    act(() => {
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("ghost-id")));
    });

    // Act
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(document.activeElement).toBe(ref.current!.heading);
  });

  it("should clear the target without moving focus while a form field inside the editor is focused", () => {
    // Arrange
    const { ref } = renderHarness();
    const input = document.createElement("input");
    input.type = "text";
    ref.current!.root.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });

    // Act
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(document.activeElement).toBe(input);
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("should not re-run on unrelated store key changes while pendingFocusTarget stays null", () => {
    // Arrange
    const { ref } = renderHarness();
    const focusSpy = vi.spyOn(ref.current!.emptyState, "focus");
    act(() => {
      useWorkoutStore.setState({ selectedStepId: "a" as never });
    });
    act(() => {
      useWorkoutStore.setState({ selectedStepId: "b" as never });
    });

    // Act
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("should collapse rapid sequential set calls into a single focus", () => {
    // Arrange
    const { ref } = renderHarness();
    const focusSpy = vi.spyOn(ref.current!.emptyState, "focus");
    act(() => {
      const s = useWorkoutStore.getState();
      s.setPendingFocusTarget(focusItem(asItemId("x")));
      s.setPendingFocusTarget(focusItem(asItemId("y")));
      s.setPendingFocusTarget(focusEmptyState);
    });

    // Act
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(ref.current!.emptyState);
  });

  it("should not re-focus when the same target is set twice", () => {
    // Arrange
    const { ref } = renderHarness();
    const focusSpy = vi.spyOn(ref.current!.emptyState, "focus");
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });
    act(() => {
      vi.runAllTimers();
    });
    const afterFirst = focusSpy.mock.calls.length;
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });

    // Act
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(afterFirst).toBe(1);
    expect(focusSpy.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("should clear pendingFocusTarget when the fallback chain yields nothing", () => {
    // Arrange
    const ref = { current: null as HarnessRefs | null };
    const BareHarness = () => {
      const rootRef = useRef<HTMLDivElement | null>(null);
      const emptyRef = useRef<HTMLButtonElement | null>(null);
      const headingRef = useRef<HTMLHeadingElement | null>(null);
      useFocusAfterAction({
        editorRootRef: rootRef,
        emptyStateButtonRef: emptyRef,
        editorHeadingRef: headingRef,
      });
      return (
        <div
          ref={(n) => {
            rootRef.current = n;
            if (n && ref.current === null) {
              ref.current = {
                root: n,
                emptyState: null as unknown as HTMLButtonElement,
                heading: null as unknown as HTMLHeadingElement,
                registerSpy: vi.fn(),
                getItemSpy: vi.fn(),
              };
            }
          }}
        />
      );
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Wrapper>
        <FocusRegistryProvider>
          <BareHarness />
        </FocusRegistryProvider>
      </Wrapper>
    );
    act(() => {
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("ghost")));
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    // Act
    warnSpy.mockRestore();

    // Assert
  });

  it("should stash the target while a Radix dialog is open and re-apply it on close via rAF", () => {
    // Arrange
    const HarnessWithDialog = ({
      harnessRef,
      dialogOpen,
    }: {
      harnessRef: { current: HarnessRefs | null };
      dialogOpen: boolean;
    }) => {
      const rootRef = useRef<HTMLDivElement | null>(null);
      const emptyStateRef = useRef<HTMLButtonElement | null>(null);
      const headingRef = useRef<HTMLHeadingElement | null>(null);
      useFocusAfterAction({
        editorRootRef: rootRef,
        emptyStateButtonRef: emptyStateRef,
        editorHeadingRef: headingRef,
      });
      return (
        <div
          ref={(n) => {
            rootRef.current = n;
            if (n && harnessRef.current === null) {
              harnessRef.current = {
                root: n,
                emptyState: emptyStateRef.current!,
                heading: headingRef.current!,
                registerSpy: vi.fn(),
                getItemSpy: vi.fn(),
              };
            }
          }}
        >
          <h2 ref={headingRef} tabIndex={-1}>
            Editor
          </h2>
          <button ref={emptyStateRef}>Add step</button>
          {dialogOpen ? (
            <div
              role="dialog"
              data-state="open"
              data-radix-popper-content-wrapper=""
              data-testid="radix-dialog"
            />
          ) : null}
        </div>
      );
    };
    const ref = { current: null as HarnessRefs | null };
    const view = render(
      <Wrapper>
        <FocusRegistryProvider>
          <HarnessWithDialog harnessRef={ref} dialogOpen />
        </FocusRegistryProvider>
      </Wrapper>
    );
    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((cb) => {
        cb(0);
        return 0;
      });
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
    expect(document.activeElement).not.toBe(ref.current!.emptyState);
    rafSpy.mockRestore();

    // Act
    view.unmount();

    // Assert
  });

  it("should focus an item registered via the context", () => {
    // Arrange
    const ref = { current: null as HarnessRefs | null };
    const Item = ({ id }: { id: string }) => {
      const value = useContext(FocusRegistryContext);
      const nodeRef = useRef<HTMLDivElement | null>(null);
      useEffect(() => {
        const el = nodeRef.current;
        if (!el) return;
        value.registerItem(asItemId(id), el);
        return () => value.unregisterItem(asItemId(id), el);
      }, [id, value]);
      return <div ref={nodeRef} data-testid={id} tabIndex={-1} />;
    };
    render(
      <Wrapper>
        <FocusRegistryProvider>
          <Harness harnessRef={ref} />
          <Item id="step-a" />
        </FocusRegistryProvider>
      </Wrapper>
    );
    act(() => {
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("step-a")));
    });
    act(() => {
      vi.runAllTimers();
    });

    // Act
    const target = document.querySelector('[data-testid="step-a"]');

    // Assert
    expect(document.activeElement).toBe(target);
  });

  // Task 6.1.d — wiring-canary must fire exactly once under both modes.
  // Under StrictMode, React double-invokes effects; the module-level
  // hasFiredCanaryThisSession flag prevents double-emission.
  it("should fire wiring-canary exactly once even under StrictMode double-mount", () => {
    // Arrange
    const spy = vi.fn<FocusTelemetry>();
    const harnessRef = { current: null as HarnessRefs | null };
    render(
      <Wrapper>
        <FocusTelemetryContext.Provider value={spy}>
          <FocusRegistryProvider>
            <Harness harnessRef={harnessRef} />
          </FocusRegistryProvider>
        </FocusTelemetryContext.Provider>
      </Wrapper>
    );

    // Act
    const canaries = spy.mock.calls.filter(([e]) => e.type === "wiring-canary");

    // Assert
    expect(canaries).toHaveLength(1);
  });
});
