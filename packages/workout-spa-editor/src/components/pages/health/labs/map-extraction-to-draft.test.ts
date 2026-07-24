import type { LabExtraction, LabExtractionValue } from "@kaiord/ai/agents";
import { describe, expect, it } from "vitest";

import { mapExtractionToDraft } from "./map-extraction-to-draft";

const EN = { locale: "en" };
const GLUCOSE_VALUE = 92;
const REF_LOW = 70;
const REF_HIGH = 105;
const DECIMAL_VALUE = 3.9;

const extraction = (overrides: Partial<LabExtraction> = {}): LabExtraction => ({
  values: [],
  ...overrides,
});

describe("mapExtractionToDraft", () => {
  it("should map a valid model-proposed key to a catalog row", () => {
    // Arrange
    const input = extraction({
      values: [
        {
          label: "GLU",
          parameterKey: "glucose",
          value: GLUCOSE_VALUE,
          unit: "mg/dL",
        },
      ],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0]).toMatchObject({
      mode: "catalog",
      parameterKey: "glucose",
      catalogLabel: "Glucose (fasting) (GLU)",
      valueRaw: String(GLUCOSE_VALUE),
      unitRaw: "mg/dL",
    });
  });

  it.each<{ scenario: string; value: LabExtractionValue; locale: string }>([
    {
      scenario: "an English display label",
      value: { label: "Ferritin (FERR)" },
      locale: "en",
    },
    {
      scenario: "a Spanish display label",
      value: { label: "Ferritina (FERR)" },
      locale: "es",
    },
    {
      scenario: "an unknown proposed key falling back to the label",
      value: { label: "Ferritin (FERR)", parameterKey: "not_a_catalog_key" },
      locale: "en",
    },
  ])("should resolve a catalog row by $scenario", ({ value, locale }) => {
    // Arrange
    const input = extraction({ values: [value] });

    // Act
    const { rows } = mapExtractionToDraft(input, { locale });

    // Assert
    expect(rows[0]).toMatchObject({
      mode: "catalog",
      parameterKey: "ferritin",
    });
  });

  it("should build a custom row carrying the verbatim label for an unmapped value", () => {
    // Arrange
    const input = extraction({ values: [{ label: "Apolipoprotein E" }] });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0]).toMatchObject({
      mode: "custom",
      customName: "Apolipoprotein E",
      parameterKey: "custom:apolipoprotein-e",
      catalogLabel: "",
    });
  });

  it.each<{
    scenario: string;
    value: LabExtractionValue;
    expected: { refLowRaw: string; refHighRaw: string; refTouched: boolean };
  }>([
    {
      scenario: "a numeric range printed on the report",
      value: {
        label: "Glucose (fasting) (GLU)",
        refLow: REF_LOW,
        refHigh: REF_HIGH,
      },
      expected: {
        refLowRaw: String(REF_LOW),
        refHighRaw: String(REF_HIGH),
        refTouched: true,
      },
    },
    {
      scenario: "a text-only range without numeric bounds",
      value: { label: "TSH", refText: "0.4-4.0 mIU/L" },
      expected: { refLowRaw: "", refHighRaw: "", refTouched: true },
    },
    {
      scenario: "no range at all",
      value: { label: "Glucose (fasting) (GLU)" },
      expected: { refLowRaw: "", refHighRaw: "", refTouched: false },
    },
  ])("should map the reference fields for $scenario", ({ value, expected }) => {
    // Arrange
    const input = extraction({ values: [value] });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0]).toMatchObject(expected);
  });

  it("should stringify an already-normalized numeric value", () => {
    // Arrange
    const input = extraction({
      values: [{ label: "hs-CRP", value: DECIMAL_VALUE }],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0].valueRaw).toBe(String(DECIMAL_VALUE));
  });

  it.each([
    {
      scenario: "keep a valid ISO date",
      date: "2026-03-05",
      expected: "2026-03-05",
    },
    {
      scenario: "blank an unparseable date",
      date: "March 5, 2026",
      expected: "",
    },
  ])("should $scenario", ({ date, expected }) => {
    // Arrange
    const input = extraction({ date });

    // Act
    const { header } = mapExtractionToDraft(input, EN);

    // Assert
    expect(header.date).toBe(expected);
  });

  it.each<{ fasting?: boolean; expected: string }>([
    { fasting: true, expected: "yes" },
    { fasting: false, expected: "no" },
    { fasting: undefined, expected: "unspecified" },
  ])(
    "should map the fasting flag $fasting to the $expected tri-state",
    ({ fasting, expected }) => {
      // Arrange
      const input = extraction({ fasting });

      // Act
      const { header } = mapExtractionToDraft(input, EN);

      // Assert
      expect(header.fasting).toBe(expected);
    }
  );

  it("should pass lab metadata through and blank absent fields", () => {
    // Arrange
    const input = extraction({
      labName: "Acme Labs",
      drawTime: "08:30",
      notes: "Fasting sample",
    });

    // Act
    const { header } = mapExtractionToDraft(input, EN);

    // Assert
    expect(header).toMatchObject({
      labName: "Acme Labs",
      drawTime: "08:30",
      notes: "Fasting sample",
    });
  });

  it("should produce exactly one row per extracted value", () => {
    // Arrange
    const input = extraction({
      values: [
        { label: "GLU", parameterKey: "glucose" },
        { label: "Weird X" },
        { label: "Ferritin (FERR)" },
      ],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows).toHaveLength(input.values.length);
  });
});
