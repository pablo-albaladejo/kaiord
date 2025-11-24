/**
 * E2E Test Utilities
 *
 * This module exports all test utilities for E2E tests, including:
 * - Touch drag helpers for mobile testing
 * - Viewport configurations for cross-device testing
 */

// Touch helpers
export {
  measureDragPerformance,
  touchDrag,
  touchDragNative,
  verifyDragPreview,
  verifyDropZone,
  verifyStepOrder,
  type ExpectedStepOrder,
  type PerformanceResult,
  type TouchDragOptions,
} from "./touch-helpers";

// Viewport configurations
export {
  MOBILE_VIEWPORTS,
  getAllViewports,
  getPrimaryViewports,
  getViewportConfig,
  type MobileViewportName,
  type ViewportConfig,
} from "./viewport-configs";
