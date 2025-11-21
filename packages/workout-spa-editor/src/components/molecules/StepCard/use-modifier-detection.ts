/**
 * Utility hook for detecting modifier keys (Control/Meta) in mouse events
 * Provides cross-browser compatibility for modifier key detection
 * Also handles synthetic events from testing frameworks
 */
export function isModifierKeyPressed(e: React.MouseEvent): boolean {
  // Check event properties directly
  if (e.ctrlKey || e.metaKey) {
    return true;
  }

  // Check native event if available
  if (e.nativeEvent instanceof MouseEvent) {
    if (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey) {
      return true;
    }
  }

  // Check getModifierState if available (for synthetic events)
  if (typeof e.getModifierState === "function") {
    if (e.getModifierState("Control") || e.getModifierState("Meta")) {
      return true;
    }
  }

  // For synthetic events, check if the event was created with modifier keys
  // This handles cases where testing frameworks create events with ctrlKey/metaKey
  const syntheticEvent = e as unknown as {
    ctrlKey?: boolean;
    metaKey?: boolean;
  };
  if (syntheticEvent.ctrlKey || syntheticEvent.metaKey) {
    return true;
  }

  return false;
}
