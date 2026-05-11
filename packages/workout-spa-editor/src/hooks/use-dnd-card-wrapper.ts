/**
 * `useDndCardWrapper` — shared wiring for `useSortable` card wrappers.
 *
 * Three sortable wrappers (`SortableStepCard`, `SortableRepetitionBlockCard`,
 * and `RepetitionBlockCard/SortableStep`) all repeat the same boilerplate:
 *
 *  1. `useSortable({ id })`
 *  2. Build a `style` object from transform/transition/isDragging
 *  3. Strip `role` from `attributes` (the inner card already owns `role`)
 *
 * This hook returns the per-wrapper outputs each consumer needs, so the
 * call sites can spread `wrapperProps` and forward `dragHandleProps`
 * without re-deriving the same data.
 */

import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, HTMLAttributes, Ref } from "react";

export type DndCardWrapper = {
  /** Spread onto the wrapper `<div>` to wire up DnD attributes. */
  wrapperProps: HTMLAttributes<HTMLElement> & { ref: Ref<HTMLElement> };
  /** Forward to the inner card's drag handle. */
  dragHandleProps: DraggableSyntheticListeners;
  /** Inline style for the wrapper (transform, transition, opacity). */
  style: CSSProperties;
  /** True while this item is the active drag source. */
  isDragging: boolean;
};

export function useDndCardWrapper(id: string): DndCardWrapper {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Drop `role` so the inner card's `role="button"` is not duplicated.
  const restAttributes = { ...attributes };
  delete (restAttributes as { role?: unknown }).role;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return {
    wrapperProps: { ...restAttributes, ref: setNodeRef as Ref<HTMLElement> },
    dragHandleProps: listeners,
    style,
    isDragging,
  };
}
