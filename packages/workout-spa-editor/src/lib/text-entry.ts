// Whether an element takes typed text: a textarea, an editable element, or
// an input that is not a toggle, a slider, a picker of files or colours, or
// a button.

const NOT_TYPED = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

export function isTextEntry(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return !NOT_TYPED.has(target.type);
  return target.isContentEditable;
}
