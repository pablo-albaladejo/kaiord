import type { Locator, Page } from "@playwright/test";
import type { TouchDragOptions } from "./touch-drag";
import { touchDrag } from "./touch-drag";

/**
 * Performance measurement result
 */
export type PerformanceResult = {
  duration: number;
  startTime: number;
  endTime: number;
};

/**
 * Measures the performance of a touch drag operation
 *
 * @param page - Playwright page object
 * @param source - Source element to drag from
 * @param target - Target element to drag to
 * @param options - Optional configuration for the drag operation
 * @returns Performance measurement result with duration in milliseconds
 */
export async function measureDragPerformance(
  page: Page,
  source: Locator,
  target: Locator,
  options: TouchDragOptions = {}
): Promise<PerformanceResult> {
  const startTime = Date.now();

  await touchDrag(page, source, target, options);

  const endTime = Date.now();
  const duration = endTime - startTime;

  return {
    duration,
    startTime,
    endTime,
  };
}
