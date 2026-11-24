import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { zonesPayloadSchema } from "../../../types/coaching-zones-schema";
import { parseDetailsHtml } from "./parse-details-html";

const fixture = (name: string): string =>
  readFileSync(join(__dirname, "fixtures", name), "utf-8");

// Keys that MUST NOT appear at any depth. Only the camelCased `bpmRest`
// is allowlisted; the DOM snake_case `bpm_rest` stays forbidden.
const FORBIDDEN_KEYS = new Set([
  "gender",
  "birthday",
  "fat",
  "smoker",
  "imc",
  "bpm_rest",
  "user_notes",
  "userNotes",
  "notes",
  "coach",
  "email",
  "records",
  "tests",
  "height",
]);

const walkAndCollectKeys = (
  node: unknown,
  acc: Set<string> = new Set()
): Set<string> => {
  if (node === null || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const child of node) walkAndCollectKeys(child, acc);
    return acc;
  }
  for (const [key, value] of Object.entries(node)) {
    acc.add(key);
    walkAndCollectKeys(value, acc);
  }
  return acc;
};

describe("parseDetailsHtml", () => {
  it("should extract physiological / paces / hrZones from the live-shape fixture (full Z1-Z5 bands)", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.physiological).toEqual({
      weight: 83,
      bpmMax: 187,
      bpmRest: 51,
    });
    expect(result.paces?.cycling).toEqual({
      z1: { lower: 111, upper: 149 },
      z2: { lower: 150, upper: 203 },
      z3: { lower: 204, upper: 239 },
      z4: { lower: 240, upper: 268 },
      z5: { lower: 269, upper: 386 },
      z4Upper: 268,
      z5Lower: 269,
    });
    expect(result.paces?.running?.z4).toEqual({
      lower: { min: 4, sec: 44 },
      upper: { min: 4, sec: 10 },
    });
    expect(result.paces?.running?.z4Upper).toEqual({ min: 4, sec: 10 });
    expect(result.paces?.swimming?.z4).toEqual({
      lower: { min: 1, sec: 39 },
      upper: { min: 1, sec: 32 },
    });
    expect(result.paces?.swimming?.z4Upper).toEqual({ min: 1, sec: 32 });
    expect(result.hrZones?.generic?.z4).toEqual({ lower: 161, upper: 174 });
    expect(result.hrZones?.cycling?.z4).toEqual({ lower: 161, upper: 174 });
    expect(result.hrZones?.cycling).toMatchObject({ z4Upper: 174 });
    expect(result.hrZones?.running?.z4).toEqual({ lower: 158, upper: 168 });
    expect(result.hrZones?.running).toMatchObject({ z4Upper: 168 });
    expect("swimming" in (result.hrZones ?? {})).toBe(false);
  });

  it("should redact forbidden fields recursively at any nesting depth", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    const allKeys = walkAndCollectKeys(result);
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(
        allKeys.has(forbidden),
        `forbidden key "${forbidden}" leaked`
      ).toBe(false);
    }
  });

  it("should map DOM 0-indexed name=z3_upper to payload key z4Upper", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.hrZones?.cycling).toMatchObject({ z4Upper: 174 });
    expect(walkAndCollectKeys(result).has("z3Upper")).toBe(false);
  });

  it("should return an empty object for non-string / empty input", () => {
    // Arrange
    const inputs = [undefined, null, ""];

    // Act
    const results = inputs.map((i) => parseDetailsHtml(i));

    // Assert
    expect(results[0]).toEqual({});
    expect(results[1]).toEqual({});
    expect(results[2]).toEqual({});
  });

  it("should emit paces.cycling z4Upper convenience scalar even when only DOM z3_upper is present (backwards compat for partial forms)", () => {
    // Arrange
    const html = `<main><section class="details">
        <div id="paces-99999" class="details-paces">
          <form action="/api/v2/paces/1"><input name="sport_id" type="hidden" value="3">
            <input name="measurement[z3_upper][0]" type="number" value="268">
          </form>
        </div>
      </section></main>`;

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    // No complete band, but z4Upper falls back to direct DOM extraction.
    expect(result.paces?.cycling).toEqual({ z4Upper: 268 });
  });

  it("should NOT leak z3_upper across sport blocks when running is partially configured", () => {
    // Arrange
    // Running (sport_id=1) has no z3_upper; cycling (sport_id=3) does.
    // Unbounded slicing would hand cycling's value to running.
    const html = `<main><section class="details">
        <div id="paces-99999" class="details-paces">
          <form action="/api/v2/paces/run"><input name="sport_id" type="hidden" value="1">
            <input name="measurement[z0_lower][0]" type="number" value="06">
            <input name="measurement[z0_lower][1]" type="number" value="34">
          </form>
          <form action="/api/v2/paces/cycle"><input name="sport_id" type="hidden" value="3">
            <input name="measurement[z3_upper][0]" type="number" value="268">
          </form>
        </div>
      </section></main>`;

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.paces?.running).toBeUndefined();
    expect(result.paces?.cycling).toEqual({ z4Upper: 268 });
  });

  it("should emit hrZones.generic with all five {lower, upper} bands when the upstream HTML has heart-rate-zone-generic", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.hrZones?.generic).toEqual({
      z1: { lower: 107, upper: 133 },
      z2: { lower: 134, upper: 147 },
      z3: { lower: 148, upper: 160 },
      z4: { lower: 161, upper: 174 },
      z5: { lower: 175, upper: 187 },
      z4Upper: 174,
    });
  });

  it("should preserve the z4Upper convenience field on the cycling Specific block alongside the full bands (1.3b)", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.hrZones?.cycling?.z3).toEqual({ lower: 148, upper: 160 });
    expect(result.hrZones?.cycling).toMatchObject({ z4Upper: 174 });
  });

  it("should omit hrZones.swimming when no heart-rate-zone-swimming block is present in the upstream HTML (1.3c)", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect("swimming" in (result.hrZones ?? {})).toBe(false);
  });

  it("should emit cycling pace bands as integer watts (single value per bound, not min:sec) (1.3d)", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.paces?.cycling?.z1).toMatchObject({ lower: 111 });
    expect(result.paces?.cycling?.z4).toMatchObject({ upper: 268 });
    expect(result.paces?.cycling).toMatchObject({ z4Upper: 268 });
  });

  it("should emit running pace bands as {min, sec} pairs per band (1.3e)", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.paces?.running?.z4?.upper).toEqual({ min: 4, sec: 10 });
    expect(result.paces?.running?.z4Upper).toEqual({ min: 4, sec: 10 });
  });

  it("should emit swimming pace bands as {min, sec} pairs per band (1.3f)", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.paces?.swimming?.z5?.upper).toEqual({ min: 1, sec: 26 });
  });

  it("should extract bpm_rest from the physio block as camelCased bpmRest (1.3g) and never emit the snake_case form", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.physiological).toMatchObject({ bpmRest: 51 });
    expect(walkAndCollectKeys(result).has("bpm_rest")).toBe(false);
  });

  it("should emit hrZones.swimming as a full Z1-Z5 band object when the upstream HTML has heart-rate-zone-swimming", () => {
    // Arrange
    const html = `<main><section class="details">
        <div id="hrzones-99999" class="details-hrzones">
          <div class="heart-rate-zone heart-rate-zone-swimming">
            <form action="/api/v2/hrzones/swim" class="remote">
              <input name="z0_lower" type="number" value="120" />
              <input name="z0_upper" type="number" value="135" />
              <input name="z1_lower" type="number" value="136" />
              <input name="z1_upper" type="number" value="148" />
              <input name="z2_lower" type="number" value="149" />
              <input name="z2_upper" type="number" value="160" />
              <input name="z3_lower" type="number" value="161" />
              <input name="z3_upper" type="number" value="172" />
              <input name="z4_lower" type="number" value="173" />
              <input name="z4_upper" type="number" value="185" />
            </form>
          </div>
        </div>
      </section></main>`;

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.hrZones?.swimming?.z1).toEqual({ lower: 120, upper: 135 });
    expect(result.hrZones?.swimming?.z4).toEqual({ lower: 161, upper: 172 });
    expect(result.hrZones?.swimming?.z5).toEqual({ lower: 173, upper: 185 });
    expect(result.hrZones?.swimming).toMatchObject({ z4Upper: 172 });
  });

  it("should still emit hrZones.generic when the generic block is a sibling of hrzones-{id} (outside the per-user container, as in production T2G)", () => {
    // Arrange
    // Cycling lives INSIDE `<div id="hrzones-{id}">`; Generic is a
    // sibling outside it. Distinct values catch any cross-block bleed.
    const html = `<main><section class="pupil-details">
        <div id="hrzones-28035" class="details-hrzones">
          <div class="heart-rate-zone heart-rate-zone-cycling">
            <form action="/api/v2/hrzones/cyc" class="remote">
              <input name="z0_lower" type="number" value="110" />
              <input name="z0_upper" type="number" value="136" />
              <input name="z1_lower" type="number" value="137" />
              <input name="z1_upper" type="number" value="150" />
              <input name="z2_lower" type="number" value="151" />
              <input name="z2_upper" type="number" value="163" />
              <input name="z3_lower" type="number" value="164" />
              <input name="z3_upper" type="number" value="177" />
              <input name="z4_lower" type="number" value="178" />
              <input name="z4_upper" type="number" value="190" />
            </form>
          </div>
        </div>
        <div class="heart-rate-zone heart-rate-zone-generic">
          <form action="/api/v2/hrzones/gen" class="remote">
            <input name="z0_lower" type="number" value="107" />
            <input name="z0_upper" type="number" value="133" />
            <input name="z1_lower" type="number" value="134" />
            <input name="z1_upper" type="number" value="147" />
            <input name="z2_lower" type="number" value="148" />
            <input name="z2_upper" type="number" value="160" />
            <input name="z3_lower" type="number" value="161" />
            <input name="z3_upper" type="number" value="174" />
            <input name="z4_lower" type="number" value="175" />
            <input name="z4_upper" type="number" value="187" />
          </form>
        </div>
      </section></main>`;

    // Act
    const result = parseDetailsHtml(html);

    // Assert
    expect(result.hrZones?.generic).toEqual({
      z1: { lower: 107, upper: 133 },
      z2: { lower: 134, upper: 147 },
      z3: { lower: 148, upper: 160 },
      z4: { lower: 161, upper: 174 },
      z5: { lower: 175, upper: 187 },
      z4Upper: 174,
    });
    expect(result.hrZones?.cycling?.z4).toEqual({ lower: 164, upper: 177 });
    expect(result.hrZones?.cycling).toMatchObject({ z4Upper: 177 });
  });

  it("should produce a payload accepted by zonesPayloadSchema", () => {
    // Arrange
    const html = fixture("details-active.html");

    // Act
    const result: z.input<typeof zonesPayloadSchema> = parseDetailsHtml(html);

    // Assert
    expect(zonesPayloadSchema.safeParse(result).success).toBe(true);
  });
});
