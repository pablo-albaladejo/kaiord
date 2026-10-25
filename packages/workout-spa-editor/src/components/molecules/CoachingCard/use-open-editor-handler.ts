import { useCallback } from "react";
import { useLocation } from "wouter";

import { withOrigin } from "../../../routing/with-origin";

/** Closes the dialog, then opens the matched workout in the editor. */
export const useOpenEditorHandler = (
  matchedId: string | null,
  onClose: () => void
): (() => void) => {
  const [, navigate] = useLocation();
  return useCallback(() => {
    if (!matchedId) return;
    onClose();
    navigate(withOrigin(`/workout/${matchedId}`, "coaching"));
  }, [matchedId, navigate, onClose]);
};
