/**
 * The floating copy of a card that follows the pointer while it is dragged.
 * It is a visual clone (aria-hidden, no pointer events) moved by writing a
 * transform per pointermove, so a drag never re-renders the week.
 */

export type DragGhost = {
  move: (x: number, y: number) => void;
  /** Settles the ghost onto `rect` (the drop target) and removes it. */
  land: (rect: DOMRect | null) => void;
  remove: () => void;
};

const LAND_MS = 160;
const LIFT = "rotate(1.5deg) scale(1.03)";

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const styleGhost = (ghost: HTMLElement, rect: DOMRect): void => {
  Object.assign(ghost.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${rect.width}px`,
    margin: "0",
    zIndex: "1000",
    pointerEvents: "none",
    // Cards are translucent over their day; in flight the copy needs an
    // opaque face or whatever it hovers shows through it.
    background: "var(--color-surface)",
    boxShadow: "0 12px 28px rgb(0 0 0 / 0.28)",
    borderRadius: "0.75rem",
    willChange: "transform",
  });
};

/** `grabX`/`grabY` is where the pointer went down, so the copy keeps the
 * card's offset under the pointer instead of hopping when it appears. */
export function createDragGhost(
  source: HTMLElement,
  grabX: number,
  grabY: number
): DragGhost {
  const rect = source.getBoundingClientRect();
  const offsetX = grabX - rect.left;
  const offsetY = grabY - rect.top;
  const ghost = source.cloneNode(true) as HTMLElement;
  // The copy must not answer to the card's test ids or element ids.
  for (const el of [ghost, ...ghost.querySelectorAll("[data-testid],[id]")]) {
    el.removeAttribute("data-testid");
    el.removeAttribute("id");
  }
  ghost.setAttribute("aria-hidden", "true");
  // aria-hidden alone leaves a cloned button in the tab order.
  ghost.inert = true;
  ghost.dataset.testid = "calendar-drag-ghost";
  styleGhost(ghost, rect);
  document.body.appendChild(ghost);
  source.dataset.dragging = "true";

  const place = (px: number, py: number, extra: string) => {
    ghost.style.transform = `translate(${px - offsetX}px, ${py - offsetY}px) ${extra}`;
  };
  // The source is released as soon as its drag ends, not when the landing
  // copy finishes: a new drag of the same card may already be under way.
  const release = () => delete source.dataset.dragging;
  const remove = () => {
    release();
    ghost.remove();
  };
  place(grabX, grabY, LIFT);

  return {
    move: (px, py) => place(px, py, LIFT),
    land: (target) => {
      if (!target || prefersReducedMotion()) return remove();
      release();
      ghost.style.transition = `transform ${LAND_MS}ms ease-out, opacity ${LAND_MS}ms ease-out`;
      ghost.style.transform = `translate(${target.left + 8}px, ${target.top + 8}px) scale(0.96)`;
      ghost.style.opacity = "0";
      window.setTimeout(() => ghost.remove(), LAND_MS);
    },
    remove,
  };
}
