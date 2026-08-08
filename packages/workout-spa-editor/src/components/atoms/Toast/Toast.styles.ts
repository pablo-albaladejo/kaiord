import type { ToastVariant } from "./Toast.types";

/**
 * Toast surfaces.
 *
 * Only one variant carries a hue. Success and warning left the palette on
 * purpose: green and amber sat 3–14° from the zone ramp, so a toast painted
 * with either asserted a training intensity it cannot mean. What a toast
 * needs to say — what happened, and whether it needs you — is said by its
 * icon and its sentence (principle 6), on the one neutral surface.
 *
 * `error` keeps the danger ramp, the single semantic hue the system has.
 */
export const variantStyles: Record<ToastVariant, string> = {
  success: "border-edge bg-surface-elevated text-ink-strong",
  info: "border-edge bg-surface-elevated text-ink-strong",
  warning: "border-edge-strong bg-surface-elevated text-ink-strong",
  error: "border-danger-border bg-danger-bg text-danger-text",
};

/**
 * Base toast styles
 */
/**
 * The icon is what tells the three neutral variants apart now that only
 * `error` carries a hue — a state says what it is with a glyph and a
 * sentence, not with a colour the zone ramp already spent.
 */
export const variantIcons: Record<ToastVariant, "check" | "info" | "alert"> = {
  success: "check",
  info: "info",
  warning: "alert",
  error: "alert",
};

export const baseToastStyles = `
  group pointer-events-auto relative flex w-full items-center justify-center
  space-x-4 overflow-hidden rounded-lg border-2 p-4 pr-8 shadow-lg
  transition-all data-[swipe=cancel]:translate-x-0
  data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]
  data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
  data-[swipe=move]:transition-none
  data-[state=open]:animate-in data-[state=closed]:animate-out
  data-[swipe=end]:animate-out data-[state=closed]:fade-out-80
  data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full
  data-[state=open]:sm:slide-in-from-bottom-full
`;
