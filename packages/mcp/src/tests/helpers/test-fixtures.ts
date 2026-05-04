import type { KRD } from "@kaiord/core";
import {
  buildKRD,
  FIXTURE_NAMES,
  getFixturePath,
  loadFitFixture,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadTcxFixture,
  loadZwoFixture,
} from "@kaiord/core/test-utils";

export {
  buildKRD,
  FIXTURE_NAMES,
  getFixturePath,
  loadFitFixture,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadTcxFixture,
  loadZwoFixture,
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
