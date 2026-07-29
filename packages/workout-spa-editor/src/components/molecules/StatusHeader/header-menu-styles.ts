/**
 * Shared chrome for the header's three dropdowns (Trends, More, Account).
 * Every colour resolves through the semantic tokens in `src/index.css`, so
 * one class list is correct in both themes — see `check-theme-dialect.mjs`.
 */
import type { BarVisibility } from "./status-entry-defs";

export const MENU_CONTENT_CLASS =
  "z-50 min-w-[13rem] rounded-xl border border-edge bg-surface-elevated p-1 shadow-lg";

export const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-body outline-none data-[highlighted]:bg-surface-page data-[highlighted]:text-ink-strong";

export const MENU_LABEL_CLASS =
  "px-3 py-2 text-xs font-semibold text-ink-muted";

export const MENU_SEPARATOR_CLASS = "my-1 h-px bg-edge-soft";

/** Amber marker, matching the Settings banner's dot. */
export const ATTENTION_DOT_CLASS =
  "ml-auto h-2 w-2 flex-none rounded-full bg-amber-500";

/**
 * Which breakpoint gives an entry its slot in the bar. Applied to a plain
 * wrapper rather than to the control itself: `Button`'s base classes
 * hardcode `inline-flex`, and on one element `hidden` and `inline-flex` are
 * equal-specificity utilities — whichever Tailwind emits last wins, which is
 * NOT reliably `hidden`.
 */
export const BAR_WRAPPER_CLASS: Record<BarVisibility, string | null> = {
  always: null,
  desktop: "hidden md:inline-flex",
  wide: "hidden lg:inline-flex",
};
