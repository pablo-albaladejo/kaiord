import { useAppKeyboardHandlers } from "../hooks/use-app-keyboard-handlers";

/** Renders keyboard shortcut bindings inside the toast context */
export function AppKeyboardShortcuts() {
  useAppKeyboardHandlers();
  return null;
}
