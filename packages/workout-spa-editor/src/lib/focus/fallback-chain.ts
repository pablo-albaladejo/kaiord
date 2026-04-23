/**
 * Fallback chain resolver (§7.5) — turns a FocusTarget plus a small
 * bag of candidate DOM refs into the actual element that should
 * receive focus, applying the strict order documented in the
 * `focus-management` spec.
 *
 * Purity: no DOM globals except classifying a candidate via its
 * `getAttribute("role")` — the caller passes the refs it already
 * has, and the resolver never queries the document.
 */

import type { FocusTarget } from "../../store/focus/focus-target.types";
import type { ItemId } from "../../store/providers/item-id";

export type FocusResolveReason =
  | "target"
  | "empty-state"
  | "first-item"
  | "heading"
  | "unresolved";

export type FocusResolveResult = {
  element: HTMLElement | null;
  reason: FocusResolveReason;
};

export type FocusResolveInput = {
  target: FocusTarget | null;
  getRegisteredItem: (id: ItemId) => HTMLElement | undefined;
  firstItemId: ItemId | null;
  emptyStateButton: HTMLElement | null;
  editorHeading: HTMLElement | null;
};

const isUsable = (el: HTMLElement | null | undefined): el is HTMLElement => {
  if (!el) return false;
  // A detached node cannot receive focus — reject it here rather than
  // attempting a focus move that the browser will silently drop.
  if (!el.isConnected) return false;
  // Never focus a bare list container — an item must own the focus.
  if (el.getAttribute("role") === "list") return false;
  return true;
};

export const resolveFocusElement = ({
  target,
  getRegisteredItem,
  firstItemId,
  emptyStateButton,
  editorHeading,
}: FocusResolveInput): FocusResolveResult => {
  // 1. Explicit target.
  if (target) {
    if (target.kind === "item") {
      const direct = getRegisteredItem(target.id);
      if (isUsable(direct)) return { element: direct, reason: "target" };
    } else if (target.kind === "empty-state") {
      if (isUsable(emptyStateButton)) {
        return { element: emptyStateButton, reason: "empty-state" };
      }
    }
  }

  // 2. Empty-state button — covers item targets that point to a gone
  // id when the list is empty.
  if (firstItemId == null && isUsable(emptyStateButton)) {
    return { element: emptyStateButton, reason: "empty-state" };
  }

  // 3. First registered item.
  if (firstItemId) {
    const first = getRegisteredItem(firstItemId);
    if (isUsable(first)) return { element: first, reason: "first-item" };
  }

  // 4. Editor heading.
  if (isUsable(editorHeading)) {
    return { element: editorHeading, reason: "heading" };
  }

  // 5. Nothing safe — the hook clears pendingFocusTarget and warns.
  return { element: null, reason: "unresolved" };
};
