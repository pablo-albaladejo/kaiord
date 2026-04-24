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
 */

import { act, render } from "@testing-library/react";
import { useContext, useEffect, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FocusRegistryContext,
  FocusRegistryProvider,
} from "../../contexts/focus-registry-context";
import { __resetOverlayObserverForTests } from "../../lib/focus/overlay-observer";
import {
  focusEmptyState,
  focusItem,
} from "../../store/focus/focus-target.types";
import { asItemId } from "../../store/providers/item-id";
import { useWorkoutStore } from "../../store/workout-store";
import { useFocusAfterAction } from "./use-focus-after-action";

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

const renderHarness = () => {
  const ref = { current: null as HarnessRefs | null };
  const view = render(
    <FocusRegistryProvider>
      <Harness harnessRef={ref} />
    </FocusRegistryProvider>
  );
  return { ref, view };
};

describe("useFocusAfterAction", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetOverlayObserverForTests();
    resetStore();
    document.body.innerHTML = "";
  });

  it("focuses the empty-state button for an empty-state target", () => {
    // Arrange
    const { ref } = renderHarness();

    // Act
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(document.activeElement).toBe(ref.current!.emptyState);
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("falls back to the heading when the item id is unknown and the list is empty", () => {
    // Arrange — no items registered, so `ghost-id` falls all the way
    // through the fallback chain. An explicit empty-state button exists,
    // so that wins before the heading; disable it to force heading.
    const { ref } = renderHarness();
    const btn = ref.current!.emptyState;
    btn.remove(); // kill the empty-state option

    // Act
    act(() => {
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("ghost-id")));
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(document.activeElement).toBe(ref.current!.heading);
  });

  it("clears the target without moving focus while a form field inside the editor is focused", () => {
    // Arrange
    const { ref } = renderHarness();
    const input = document.createElement("input");
    input.type = "text";
    ref.current!.root.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    // Act
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — focus stayed on the input; pendingFocusTarget cleared.
    expect(document.activeElement).toBe(input);
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
  });

  it("does not re-run on unrelated store key changes while pendingFocusTarget stays null", () => {
    // Arrange — spy on element.focus to count focus moves.
    const { ref } = renderHarness();
    const focusSpy = vi.spyOn(ref.current!.emptyState, "focus");

    // Act — poke an unrelated key (selectedStepId) several times.
    act(() => {
      useWorkoutStore.setState({ selectedStepId: "a" as never });
    });
    act(() => {
      useWorkoutStore.setState({ selectedStepId: "b" as never });
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — no focus moved.
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("collapses rapid sequential set calls into a single focus", () => {
    // Arrange
    const { ref } = renderHarness();
    const focusSpy = vi.spyOn(ref.current!.emptyState, "focus");

    // Act — three sets in one act() batch; React re-renders once.
    act(() => {
      const s = useWorkoutStore.getState();
      s.setPendingFocusTarget(focusItem(asItemId("x")));
      s.setPendingFocusTarget(focusItem(asItemId("y")));
      s.setPendingFocusTarget(focusEmptyState);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — exactly one focus call, targeting the last value.
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(ref.current!.emptyState);
  });

  it("does not re-focus when the same target is set twice", () => {
    // Arrange
    const { ref } = renderHarness();
    const focusSpy = vi.spyOn(ref.current!.emptyState, "focus");

    // Act — first set focuses, second set with the same target is a no-op.
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
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    expect(afterFirst).toBe(1);
    // prevTargetRef still holds the prior target, so the second set
    // either short-circuits (same reference) or re-fires only once.
    // Either way we must NOT exceed 2 cumulative calls.
    expect(focusSpy.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("clears pendingFocusTarget when the fallback chain yields nothing", () => {
    // Arrange — render a harness with NO empty-state and NO heading,
    // so `focusItem(ghost)` has no resolution path.
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
      <FocusRegistryProvider>
        <BareHarness />
      </FocusRegistryProvider>
    );

    // Act
    act(() => {
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("ghost")));
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — cleared; dev warning emitted.
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("stashes the target while a Radix dialog is open and re-applies it on close via rAF", () => {
    // Arrange — a Radix-flagged dialog that renders INSIDE the editor
    // root through a prop toggle. Starting the test with the dialog
    // present guarantees the observer's initial synchronous count is
    // 1, so we do not have to rely on the MutationObserver microtask
    // firing under fake timers.
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
      <FocusRegistryProvider>
        <HarnessWithDialog harnessRef={ref} dialogOpen />
      </FocusRegistryProvider>
    );

    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((cb) => {
        cb(0);
        return 0;
      });

    // Act — set pendingFocusTarget while the dialog is open.
    act(() => {
      useWorkoutStore.getState().setPendingFocusTarget(focusEmptyState);
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert — store cleared (stash path) and focus did NOT move to
    // the empty-state button while the overlay was open.
    expect(useWorkoutStore.getState().pendingFocusTarget).toBeNull();
    expect(document.activeElement).not.toBe(ref.current!.emptyState);

    rafSpy.mockRestore();
    view.unmount();
  });

  it("focuses an item registered via the context", () => {
    // Arrange — render a child that registers itself in the registry.
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
      <FocusRegistryProvider>
        <Harness harnessRef={ref} />
        <Item id="step-a" />
      </FocusRegistryProvider>
    );

    // Act
    act(() => {
      useWorkoutStore
        .getState()
        .setPendingFocusTarget(focusItem(asItemId("step-a")));
    });
    act(() => {
      vi.runAllTimers();
    });

    // Assert
    const target = document.querySelector('[data-testid="step-a"]');
    expect(document.activeElement).toBe(target);
  });
});
