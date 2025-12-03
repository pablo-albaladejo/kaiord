/**
 * Test Utilities
 *
 * Centralized exports for all test utilities used in the SPA editor.
 */

// Fixture utilities
export {
  FIXTURE_NAMES,
  getFixturePath,
  loadFixturePair,
  loadKrdFixture,
  loadKrdFixtureRaw,
} from "./fixtures";

// Console spy utilities for detecting React warnings
export {
  cleanupConsoleErrorSpy,
  expectNoConsoleErrors,
  expectNoReactPropWarnings,
  expectNoReactWarnings,
  setupConsoleErrorSpy,
} from "./console-spy";
