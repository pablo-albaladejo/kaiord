/**
 * Form-field guard shared by every global keyboard listener.
 *
 * While focus sits inside a text field, textarea, select or contenteditable
 * region, keystrokes belong to that field — no app-level shortcut may claim
 * them. Extracted so each listener in the keydown chain applies the exact
 * same rule.
 */
export function isFormElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement &&
      (target.isContentEditable || target.contentEditable === "true"))
  );
}
