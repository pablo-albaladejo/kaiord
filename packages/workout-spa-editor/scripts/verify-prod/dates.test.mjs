import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { weekIdOf, windowDayOffsets } from "./dates.mjs";

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

describe("windowDayOffsets", () => {
  it("should label the window's days with the page's Intl, not Node's", async () => {
    const calls = [];
    const page = {
      evaluate: async (fn, arg) => {
        calls.push(arg);
        return ["9 sept", "10 sept", "11 sept"];
      },
    };

    const offsets = await windowDayOffsets(page, new Date(2026, 8, 11), 3);

    assert.deepEqual(
      [...offsets],
      [
        ["9 sept", 0],
        ["10 sept", 1],
        ["11 sept", 2],
      ]
    );
    assert.deepEqual(calls, [
      { end: Date.UTC(2026, 8, 11), count: 3, dayMs: 86_400_000 },
    ]);
  });
});
