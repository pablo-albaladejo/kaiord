import type { KRD } from "@kaiord/core";
import {
  buildKRD,
  loadFitFixture,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadTcxFixture,
  loadZwoFixture,
  getFixturePath,
  FIXTURE_NAMES,
} from "@kaiord/core/test-utils";

export {
  buildKRD,
  loadFitFixture,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadTcxFixture,
  loadZwoFixture,
  getFixturePath,
  FIXTURE_NAMES,
};

export const createMinimalKrd = (overrides?: Partial<KRD>): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2025-01-15T10:00:00Z",
    sport: "cycling",
  },
  ...overrides,
});
