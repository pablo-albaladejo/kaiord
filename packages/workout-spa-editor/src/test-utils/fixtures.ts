/**
 * Test Fixture Helpers for SPA Editor
 *
 * Re-exports fixtures from @kaiord/core for use in SPA editor tests.
 */

// Re-export all fixture utilities from core
export {
  FIXTURE_NAMES,
  getFixturePath,
  loadFixturePair,
  loadKrdFixture,
  loadKrdFixtureRaw,
} from "@kaiord/core/test-utils";

// Note: loadFitFixture is not re-exported as SPA editor only works with KRD files
