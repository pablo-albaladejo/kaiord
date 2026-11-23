import { isTextEntry } from "../text-entry";

// Whether the athlete has done anything on the page yet. A silent update is
// applied only before that: a file dragged in from the desktop, a paste, a
// touch, a scroll or a field taking focus counts as much as a click or a key.

const INPUT_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
  "dragenter",
  "drop",
  "paste",
];

let interacted = false;

const mark = () => {
  interacted = true;
};

const onFocusIn = (event: Event) => {
  if (isTextEntry(event.target)) mark();
};

/** Starts watching for the first input; idempotent per page. */
export function trackFirstInput(): void {
  for (const type of INPUT_EVENTS) {
    window.addEventListener(type, mark, { capture: true, once: true });
  }
  window.addEventListener("focusin", onFocusIn, { capture: true });
}

export const hasInteracted = (): boolean => interacted;
