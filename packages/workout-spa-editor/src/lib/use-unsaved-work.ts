import { useEffect } from "react";

import { armUnsavedEdits } from "./unsaved-edits";

/** Reports unsaved work to the registry while `active` holds. */
export function useUnsavedWork(active: boolean): void {
  useEffect(() => (active ? armUnsavedEdits() : undefined), [active]);
}
