/**
 * Fallback chain (§7.5): when the requested FocusTarget cannot be
 * resolved to a live DOM element, the resolver walks down an ordered
 * list of safe fallbacks so that focus is never dropped or left on a
 * bare `role="list"` container.
 *
 * Order of preference:
 *   1. The explicit target (item id / empty-state).
 *   2. The main-list empty-state button (`{kind: "empty-state"}` never
 *      misses — an item target that points to a gone id falls back
 *      here when the list is empty).
 *   3. The first item registered with the focus registry.
 *   4. The labelled editor heading (`<h2 tabIndex={-1}>`).
 *   5. `null` (no safe target) — the hook clears pendingFocusTarget
 *      and logs a dev warning.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveFocusElement } from "./fallback-chain";
import {
  focusEmptyState,
  focusItem,
} from "../../store/focus/focus-target.types";
import { asItemId } from "../../store/providers/item-id";

// Elements must be attached to the document tree because the resolver
// rejects detached nodes — a detached node cannot accept focus anyway.
const el = (testId: string) => {
  const node = document.createElement("div");
  node.setAttribute("data-testid", testId);
  document.body.appendChild(node);
  return node;
};

describe("resolveFocusElement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("returns the registered element when the item target resolves", () => {
    // Arrange
    const target = el("step-1");
    const getRegisteredItem = vi.fn((id: string) =>
      id === "step-1" ? target : undefined
    );

    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("step-1")),
      getRegisteredItem,
      firstItemId: null,
      emptyStateButton: null,
      editorHeading: null,
    });

    // Assert
    expect(result.element).toBe(target);
    expect(result.reason).toBe("target");
  });

  it("returns the empty-state button for an empty-state target", () => {
    // Arrange
    const button = el("empty-state-btn");

    // Act
    const result = resolveFocusElement({
      target: focusEmptyState,
      getRegisteredItem: () => undefined,
      firstItemId: null,
      emptyStateButton: button,
      editorHeading: null,
    });

    // Assert
    expect(result.element).toBe(button);
    expect(result.reason).toBe("empty-state");
  });

  it("falls back to the empty-state button when the item id is gone and the list is empty", () => {
    // Arrange — item target whose element is not registered, AND no
    // first item either (list is empty). Empty-state is the next step.
    const button = el("empty-state-btn");

    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem: () => undefined,
      firstItemId: null,
      emptyStateButton: button,
      editorHeading: null,
    });

    // Assert
    expect(result.element).toBe(button);
    expect(result.reason).toBe("empty-state");
  });

  it("falls back to the first registered item when the requested item is gone but the list is not", () => {
    // Arrange
    const first = el("first-step");
    const getRegisteredItem = vi.fn((id: string) =>
      id === "first" ? first : undefined
    );

    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem,
      firstItemId: asItemId("first"),
      emptyStateButton: null,
      editorHeading: null,
    });

    // Assert
    expect(result.element).toBe(first);
    expect(result.reason).toBe("first-item");
  });

  it("falls back to the editor heading when nothing else is available", () => {
    // Arrange
    const heading = el("editor-heading");

    // Act — no registered item, no empty-state button, only the heading.
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem: () => undefined,
      firstItemId: null,
      emptyStateButton: null,
      editorHeading: heading,
    });

    // Assert
    expect(result.element).toBe(heading);
    expect(result.reason).toBe("heading");
  });

  it("returns null (and reason=unresolved) when every fallback is missing", () => {
    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem: () => undefined,
      firstItemId: null,
      emptyStateButton: null,
      editorHeading: null,
    });

    // Assert
    expect(result.element).toBeNull();
    expect(result.reason).toBe("unresolved");
  });

  it("skips a first-item id whose element is not registered and proceeds to the heading", () => {
    // Arrange — firstItemId exists but the registry has nothing for it.
    const heading = el("editor-heading");

    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem: () => undefined,
      firstItemId: asItemId("stale-first"),
      emptyStateButton: null,
      editorHeading: heading,
    });

    // Assert
    expect(result.element).toBe(heading);
    expect(result.reason).toBe("heading");
  });

  it("rejects detached elements (isConnected=false) — focus moves would be silently dropped", () => {
    // Arrange — a detached heading ref; isUsable must reject it.
    const detached = document.createElement("div");

    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem: () => undefined,
      firstItemId: null,
      emptyStateButton: null,
      editorHeading: detached,
    });

    // Assert
    expect(result.element).toBeNull();
    expect(result.reason).toBe("unresolved");
  });

  it("never resolves to an element with role=list", () => {
    // Arrange — a malicious / buggy heading ref that carries role=list.
    const badHeading = el("bad-heading");
    badHeading.setAttribute("role", "list");

    // Act
    const result = resolveFocusElement({
      target: focusItem(asItemId("ghost-id")),
      getRegisteredItem: () => undefined,
      firstItemId: null,
      emptyStateButton: null,
      editorHeading: badHeading,
    });

    // Assert — the heading slot was rejected; unresolved.
    expect(result.element).toBeNull();
    expect(result.reason).toBe("unresolved");
  });
});
