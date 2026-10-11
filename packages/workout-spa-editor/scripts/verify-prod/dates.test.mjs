import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { weekIdOf } from "./dates.mjs";

describe("weekIdOf", () => {
  it("should name the ISO week the SPA routes a day to", () => {
    const cases = {
      "2026-10-05": "2026-W41",
      "2026-10-11": "2026-W41",
      "2026-01-01": "2026-W01",
      "2026-12-28": "2026-W53",
      "2027-01-01": "2026-W53",
      "2021-01-04": "2021-W01",
    };
    for (const [day, week] of Object.entries(cases)) {
      assert.equal(weekIdOf(day), week, day);
    }
  });
});
