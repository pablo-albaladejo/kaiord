/**
 * The palette carries no `animate-in`/`animate-out` classes, unlike
 * `ShortcutSheet`. Those classes emit no CSS in this tree (no
 * `tailwindcss-animate`, no keyframes), so they were dead — and here they
 * would be a trap rather than a no-op: `CommandPaletteBody` resets the query
 * and the active row by unmounting, and an exit animation would make Radix's
 * `Presence` hold it mounted for the animation's duration, so a close-then-
 * reopen inside that window would show the previous query again. Animating
 * this dialog means resetting that state explicitly first.
 */

export const OVERLAY_CLASS = "fixed inset-0 z-50 bg-black/50";

export const CONTENT_CLASS =
  "fixed left-[50%] top-[15%] z-50 w-full max-w-xl translate-x-[-50%] overflow-hidden border border-edge bg-surface shadow-lg sm:rounded-2xl";

export const INPUT_CLASS =
  "flex-1 bg-transparent text-sm text-ink-strong outline-none placeholder:text-ink-muted";
