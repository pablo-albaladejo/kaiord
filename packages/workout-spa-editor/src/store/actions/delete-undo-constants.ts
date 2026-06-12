/**
 * Shared timing for the delete → undo affordance. The Undo toast MUST out-live
 * the in-memory retention of the deleted step/block, so the toast `duration`
 * and the expiry filter both read {@link UNDO_DELETE_WINDOW_MS}; the cleanup
 * sweep ticks at {@link UNDO_DELETE_CLEANUP_TICK_MS} to expire items shortly
 * after the window closes.
 */
export const UNDO_DELETE_WINDOW_MS = 5000;
export const UNDO_DELETE_CLEANUP_TICK_MS = 1000;
