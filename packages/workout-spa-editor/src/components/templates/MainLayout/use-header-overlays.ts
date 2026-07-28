import { useCallback } from "react";

import { useKeyboardShortcuts } from "../../../hooks/use-keyboard-shortcuts";
import { useLazyDialog } from "../../../hooks/use-lazy-dialog";

/**
 * The header's three lazy overlays and the global bindings that open them:
 * `?` for the shortcut sheet and Ctrl+K/⌘K for the command palette.
 */
export function useHeaderOverlays() {
  const help = useLazyDialog();
  const shortcuts = useLazyDialog();
  const palette = useLazyDialog();

  const showShortcuts = shortcuts.show;
  const showPalette = palette.show;
  const setPaletteOpen = palette.setOpen;

  const onShowShortcuts = useCallback(() => {
    showShortcuts();
    return true;
  }, [showShortcuts]);

  const onShowCommandPalette = useCallback(() => {
    showPalette();
    return true;
  }, [showPalette]);

  // The palette's "all shortcuts" footer hands over to the sheet.
  const onPaletteShortcuts = useCallback(() => {
    setPaletteOpen(false);
    showShortcuts();
  }, [setPaletteOpen, showShortcuts]);

  useKeyboardShortcuts({ onShowShortcuts, onShowCommandPalette });

  return { help, shortcuts, palette, onPaletteShortcuts };
}
