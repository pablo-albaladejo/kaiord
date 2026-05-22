import type { ReactNode } from "react";

import { ImportDropzoneOverlay } from "../organisms/ImportDropzoneOverlay/ImportDropzoneOverlay";
import { ScratchEditorSurface } from "../organisms/ScratchEditorSurface/ScratchEditorSurface";

export type NewWorkoutMode = "scratch" | "import";

export function deriveNewWorkoutMode(
  search: string
): NewWorkoutMode | undefined {
  const params = new URLSearchParams(search);
  if (params.get("action") === "import") return "import";
  if (params.get("source") === "scratch") return "scratch";
  return undefined;
}

/**
 * Pure dispatcher for the `/workout/new` route's new-workout surface.
 * Lives in a sibling file so `EditorPage.tsx` stays under the 100-line
 * cap. Returns `null` for unknown modes (defensive — unreachable via
 * `NewWorkoutRoute`).
 */
export function renderNewWorkoutSurface(
  mode: NewWorkoutMode | undefined
): ReactNode {
  if (mode === "scratch") return <ScratchEditorSurface />;
  if (mode === "import") return <ImportDropzoneOverlay />;
  return null;
}
