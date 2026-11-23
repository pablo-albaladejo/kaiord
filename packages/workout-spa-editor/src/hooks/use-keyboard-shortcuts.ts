import { useEffect, useRef } from "react";

import type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";
import {
  createEscapeHandler,
  createKeyDownHandler,
} from "./keyboard-shortcut-handlers";

export type { KeyboardShortcutHandlers } from "./keyboard-shortcut-handlers";

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  // Latest-handlers ref: bind listeners ONCE on mount but always invoke
  // whatever handlers were passed on the most recent render. Avoids
  // re-binding on every parent render (which the previous explicit-deps
  // form was trying to manage manually) and satisfies exhaustive-deps
  // cleanly because the effect references only the ref (stable).
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    // Listeners read handlersRef.current at FIRE-TIME (not at mount-time)
    // so handler updates from parent renders are reflected immediately.
    const handleKeyDown = (event: KeyboardEvent) =>
      createKeyDownHandler(handlersRef.current)(event);
    const handleEscape = (event: KeyboardEvent) =>
      createEscapeHandler(handlersRef.current.onClearSelection)(event);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);
}
