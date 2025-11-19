/**
 * Utility hook for detecting modifier keys (Control/Meta) in mouse events
 * Provides cross-browser compatibility for modifier key detection
 */
export function isModifierKeyPressed(e: React.MouseEvent): boolean {
  return (
    e.ctrlKey ||
    e.metaKey ||
    (typeof e.getModifierState === "function" &&
      (e.getModifierState("Control") || e.getModifierState("Meta"))) ||
    (e.nativeEvent instanceof MouseEvent &&
      (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey))
  );
}
