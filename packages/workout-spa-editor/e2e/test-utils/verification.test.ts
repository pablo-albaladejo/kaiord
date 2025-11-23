/**
 * Verification test for touch helpers and viewport configs
 *
 * This file verifies that all utilities are properly exported and can be imported.
 * It's not meant to be run as an actual E2E test, but rather as a TypeScript
 * compilation check.
 */

import { test } from "@playwright/test";
import {
  DESKTOP_VIEWPORTS,
  MOBILE_VIEWPORTS,
  VIEWPORTS,
  getMobileViewports,
  getViewportConfig,
  getViewportDimensions,
  isMobileViewport,
  measureDragPerformance,
  touchDrag,
  touchDragNative,
  verifyDragPreview,
  verifyDropZone,
  verifyStepOrder,
  type ExpectedStepOrder,
  type PerformanceResult,
  type TouchDragOptions,
  type ViewportConfig,
  type ViewportName,
} from "./index";

test.describe("Touch Helpers Verification", () => {
  test.skip("verify all utilities are exported", () => {
    // This test is skipped - it's only for TypeScript verification
    // Verify functions are defined
    const functions = [
      touchDrag,
      touchDragNative,
      verifyStepOrder,
      measureDragPerformance,
      verifyDragPreview,
      verifyDropZone,
      getViewportConfig,
      getMobileViewports,
      isMobileViewport,
      getViewportDimensions,
    ];

    functions.forEach((fn) => {
      if (typeof fn !== "function") {
        throw new Error(`Expected function but got ${typeof fn}`);
      }
    });

    // Verify viewport configs are defined
    const viewportConfigs = [MOBILE_VIEWPORTS, DESKTOP_VIEWPORTS, VIEWPORTS];

    viewportConfigs.forEach((config) => {
      if (typeof config !== "object") {
        throw new Error(`Expected object but got ${typeof config}`);
      }
    });

    // Verify types are available (TypeScript compilation check)
    const _options: TouchDragOptions = { steps: 10 };
    const _order: ExpectedStepOrder = [{ duration: 300, power: 200 }];
    const _result: PerformanceResult = {
      duration: 100,
      startTime: 0,
      endTime: 100,
    };
    const _viewport: ViewportConfig = MOBILE_VIEWPORTS.pixel5;
    const _name: ViewportName = "pixel5";

    // Suppress unused variable warnings
    void _options;
    void _order;
    void _result;
    void _viewport;
    void _name;
  });
});
