/**
 * Touch drag helper utilities for E2E tests
 *
 * This module provides reusable functions for testing touch drag interactions
 * using Playwright's touchscreen API.
 */

export { measureDragPerformance } from "./performance-helpers";
export type { PerformanceResult } from "./performance-helpers";
export { touchDrag } from "./touch-drag";
export type { TouchDragOptions } from "./touch-drag";
export { touchDragNative } from "./touch-drag-native";
export {
  verifyDragPreview,
  verifyDropZone,
  verifyStepOrder,
} from "./verification-helpers";
export type { ExpectedStepOrder } from "./verification-helpers";
