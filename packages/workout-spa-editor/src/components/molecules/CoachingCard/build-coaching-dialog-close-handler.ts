/**
 * Builds the close handler used by CoachingActivityDialog so every
 * dismiss path (Radix `onOpenChange`, the inline `[Close]` button, and
 * any future X affordance) aborts an in-flight AI request before
 * delegating to the parent's `onClose`.
 *
 * `cancelAi` is a no-op when no request is pending (per
 * `useCoachingAi`), so calling it eagerly is safe — this keeps the
 * abort contract uniform across dismiss paths (per
 * coaching-activity-dialog-redesign §6.8 / D2).
 */
export const buildCoachingDialogCloseHandler =
  (cancelAi: () => void, onClose: () => void) => () => {
    cancelAi();
    onClose();
  };
