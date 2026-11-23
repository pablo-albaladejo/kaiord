import { isTextEntry } from "./text-entry";
import { registerUnsavedProbe } from "./unsaved-edits";

// Any dialog the athlete typed into holds unsaved work until it closes:
// saving or cancelling a dialog removes its fields. This covers every dialog,
// present and future, without each one reporting; surfaces outside a dialog
// report their own drafts.

const DIALOG = '[role="dialog"], [role="alertdialog"], dialog';

const typed = new Set<HTMLElement>();

const inOpenDialog = (field: HTMLElement): boolean =>
  field.isConnected && field.closest(DIALOG) !== null;

function stillTyped(): boolean {
  for (const field of typed) if (!field.isConnected) typed.delete(field);
  return [...typed].some(inOpenDialog);
}

const onInput = (event: Event) => {
  const field = event.target;
  if (isTextEntry(field) && field.closest(DIALOG)) typed.add(field);
};

let watching = false;

/** Starts counting typed dialog fields as unsaved work; idempotent. */
export function watchDialogInput(): void {
  if (watching) return;
  watching = true;
  document.addEventListener("input", onInput, true);
  registerUnsavedProbe(stillTyped);
}
