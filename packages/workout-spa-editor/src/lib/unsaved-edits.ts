// Whether this tab holds edits that are not saved: the same condition that
// arms the `beforeunload` prompt. The update flow reads it before it lets a
// new version take over, so an update never discards work.

const armed = new Set<symbol>();

/** Marks the tab as holding unsaved edits until the returned disarm runs. */
export function armUnsavedEdits(): () => void {
  const token = Symbol("unsaved");
  armed.add(token);
  return () => {
    armed.delete(token);
  };
}

export const hasUnsavedEdits = (): boolean => armed.size > 0;
