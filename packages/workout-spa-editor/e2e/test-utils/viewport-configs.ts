/**
 * Viewport Configuration Utilities for Mobile Touch Drag Testing
 *
 * This module provides viewport presets for mobile device testing.
 * The presets match Playwright's built-in device configurations and
 * extend them with additional common mobile devices.
 *
 * @module viewport-configs
 */

/**
 * Viewport configuration for a mobile device
 */
export type ViewportConfig = {
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
  /** Whether the device supports touch events */
  hasTouch: boolean;
};

/**
 * Mobile viewport presets for testing
 *
 * These configurations match common mobile devices and are used
 * for cross-device compatibility testing of touch drag functionality.
 */
export const MOBILE_VIEWPORTS = {
  /**
   * Google Pixel 5 (Android)
   * Matches Playwright's "Mobile Chrome" project configuration
   * Use for: Testing Android Chrome touch interactions
   */
  pixel5: { width: 393, height: 851, hasTouch: true },

  /**
   * Apple iPhone 12 (iOS)
   * Matches Playwright's "Mobile Safari" project configuration
   * Use for: Testing iOS Safari touch interactions
   */
  iphone12: { width: 390, height: 844, hasTouch: true },

  /**
   * Apple iPhone SE (2nd generation) (iOS)
   * Smaller screen size for testing compact layouts
   * Use for: Testing on smaller iOS devices
   */
  iphoneSE: { width: 375, height: 667, hasTouch: true },

  /**
   * Apple iPhone 14 Pro Max (iOS)
   * Larger screen size for testing expanded layouts
   * Use for: Testing on larger iOS devices with more screen real estate
   */
  iphone14ProMax: { width: 430, height: 932, hasTouch: true },

  /**
   * Samsung Galaxy S21 (Android)
   * Common Android device with standard dimensions
   * Use for: Testing on mid-range Android devices
   */
  galaxyS21: { width: 360, height: 800, hasTouch: true },

  /**
   * Apple iPad Mini (iOS)
   * Tablet viewport for testing larger touch interfaces
   * Use for: Testing tablet-optimized layouts and touch interactions
   */
  iPadMini: { width: 768, height: 1024, hasTouch: true },
} as const;

/**
 * Type representing all available mobile viewport preset names
 */
export type MobileViewportName = keyof typeof MOBILE_VIEWPORTS;

/**
 * Get a viewport configuration by name
 *
 * @param name - The name of the viewport preset
 * @returns The viewport configuration
 *
 * @example
 * ```typescript
 * const viewport = getViewportConfig('pixel5');
 * test.use({ viewport });
 * ```
 */
export const getViewportConfig = (name: MobileViewportName): ViewportConfig => {
  return MOBILE_VIEWPORTS[name];
};

/**
 * Get all available viewport configurations as an array
 *
 * Useful for parameterized tests that run across multiple devices.
 *
 * @returns Array of viewport configurations with their names
 *
 * @example
 * ```typescript
 * for (const { name, config } of getAllViewports()) {
 *   test.describe(`Touch drag - ${name}`, () => {
 *     test.use({ viewport: config });
 *     // ... tests
 *   });
 * }
 * ```
 */
export const getAllViewports = (): Array<{
  name: MobileViewportName;
  config: ViewportConfig;
}> => {
  return (Object.keys(MOBILE_VIEWPORTS) as Array<MobileViewportName>).map(
    (name) => ({
      name,
      config: MOBILE_VIEWPORTS[name],
    })
  );
};

/**
 * Get viewport configurations for primary test devices
 *
 * Returns only the Pixel 5 and iPhone 12 configurations that match
 * the Playwright project configurations. Use this for core test coverage.
 *
 * @returns Array of primary viewport configurations
 *
 * @example
 * ```typescript
 * for (const { name, config } of getPrimaryViewports()) {
 *   test.describe(`Touch drag - ${name}`, () => {
 *     test.use({ viewport: config });
 *     // ... tests
 *   });
 * }
 * ```
 */
export const getPrimaryViewports = (): Array<{
  name: MobileViewportName;
  config: ViewportConfig;
}> => {
  return [
    { name: "pixel5", config: MOBILE_VIEWPORTS.pixel5 },
    { name: "iphone12", config: MOBILE_VIEWPORTS.iphone12 },
  ];
};
