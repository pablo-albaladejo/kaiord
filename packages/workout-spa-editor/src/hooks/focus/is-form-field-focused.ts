/**
 * Form-field guard (§7.3).
 *
 * Focus moves must never steal focus away from a text-editing surface
 * while the user is typing. We treat `<input>` (except checkbox/radio/
 * button-style), `<textarea>`, `<select>`, and any element whose
 * `isContentEditable === true` as form fields. The predicate only
 * matters when the active element lives *inside* the editor root —
 * focus parked in a modal outside the root is not our problem.
 */

const TEXT_EDITING_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
]);

export const isFormFieldFocused = (editorRoot: HTMLElement | null): boolean => {
  if (!editorRoot) return false;
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (!editorRoot.contains(active)) return false;

  if (active.isContentEditable) return true;
  // jsdom does not always propagate `isContentEditable` correctly —
  // the attribute-level check covers the common `contenteditable="true"`
  // case too.
  const editable = active.getAttribute("contenteditable");
  if (editable === "true" || editable === "plaintext-only") return true;

  const tag = active.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (active as HTMLInputElement).type.toLowerCase();
    return TEXT_EDITING_INPUT_TYPES.has(type);
  }
  return false;
};
