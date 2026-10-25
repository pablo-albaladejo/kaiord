/**
 * The visible half of a calendar drag: a ghost of the card that follows the
 * pointer, the source card dimmed in place, and a grabbing cursor. The ghost
 * appears only once the pointer travels past a small threshold, so a plain
 * click on a card never flashes a copy.
 */

import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import { createDragGhost, type DragGhost } from "./drag-ghost";

const START_THRESHOLD_PX = 4;

export type DragPreview = {
  move: (x: number, y: number) => void;
  end: (dropTarget: HTMLElement | null) => void;
};

const lockPage = (locked: boolean): void => {
  const { style } = document.body;
  style.cursor = locked ? "grabbing" : "";
  style.userSelect = locked ? "none" : "";
};

export function createDragPreview(
  source: HTMLElement,
  startX: number,
  startY: number
): DragPreview {
  let ghost: DragGhost | null = null;

  return {
    move: (x, y) => {
      if (ghost) return ghost.move(x, y);
      if (Math.hypot(x - startX, y - startY) < START_THRESHOLD_PX) return;
      ghost = createDragGhost(source, startX, startY);
      ghost.move(x, y);
      lockPage(true);
    },
    end: (dropTarget) => {
      lockPage(false);
      ghost?.land(dropTarget?.getBoundingClientRect() ?? null);
      ghost = null;
    },
  };
}

/** Drops any stale preview and starts a new one from a card's pointerdown. */
export const restartDragPreview = (
  previewRef: RefObject<DragPreview | null>,
  event: ReactPointerEvent
): void => {
  previewRef.current?.end(null);
  previewRef.current = createDragPreview(
    event.currentTarget as HTMLElement,
    event.clientX,
    event.clientY
  );
};
