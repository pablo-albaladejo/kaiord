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
  "fixed left-[50%] top-[15%] z-50 w-full max-w-xl translate-x-[-50%] overflow-hidden border border-gray-200 bg-white shadow-lg sm:rounded-xl dark:border-slate-700 dark:bg-slate-900";

export const INPUT_CLASS =
  "flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white";
