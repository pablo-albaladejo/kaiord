/**
 * Test Utilities
 *
 * Centralized exports for all test utilities used in the SPA editor.
 */

// Console spy utilities for detecting React warnings
export {
  cleanupConsoleErrorSpy,
  expectNoConsoleErrors,
  expectNoReactPropWarnings,
  expectNoReactWarnings,
  setupConsoleErrorSpy,
} from "./console-spy";

// Zone fixtures for ZoneEditor + zone calculator tests
export * from "./zone-fixtures";

// Application-layer fixtures (compliance, coaching duration, cost estimation, sync-zones bands)
export * from "./application-fixtures";
