import type { LabExtraction } from "@kaiord/ai/agents";
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

  it("should resolve a catalog row by its English display label", () => {
    // Arrange
    const input = extraction({ values: [{ label: "Ferritin (FERR)" }] });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0]).toMatchObject({
      mode: "catalog",
      parameterKey: "ferritin",
    });
  });

  it("should resolve a catalog row by its Spanish display label", () => {
    // Arrange
    const input = extraction({ values: [{ label: "Ferritina (FERR)" }] });

    // Act
    const { rows } = mapExtractionToDraft(input, { locale: "es" });

    // Assert
    expect(rows[0]).toMatchObject({
      mode: "catalog",
      parameterKey: "ferritin",
    });
  });

  it("should ignore an unknown proposed key and fall back to the label", () => {
    // Arrange
    const input = extraction({
      values: [{ label: "Ferritin (FERR)", parameterKey: "not_a_catalog_key" }],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

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

  it("should set the reference fields and mark refTouched when a range is printed", () => {
    // Arrange
    const input = extraction({
      values: [
        {
          label: "Glucose (fasting) (GLU)",
          refLow: REF_LOW,
          refHigh: REF_HIGH,
        },
      ],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0]).toMatchObject({
      refLowRaw: String(REF_LOW),
      refHighRaw: String(REF_HIGH),
      refTouched: true,
    });
  });

  it("should mark refTouched for a text-only range without numeric bounds", () => {
    // Arrange
    const input = extraction({
      values: [{ label: "TSH", refText: "0.4-4.0 mIU/L" }],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0].refTouched).toBe(true);
    expect(rows[0].refLowRaw).toBe("");
    expect(rows[0].refHighRaw).toBe("");
  });

  it("should leave refTouched false when no range is printed", () => {
    // Arrange
    const input = extraction({
      values: [{ label: "Glucose (fasting) (GLU)" }],
    });

    // Act
    const { rows } = mapExtractionToDraft(input, EN);

    // Assert
    expect(rows[0].refTouched).toBe(false);
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

  it("should keep a valid ISO date and blank an invalid one", () => {
    // Arrange
    const valid = extraction({ date: "2026-03-05" });
    const invalid = extraction({ date: "March 5, 2026" });

    // Act
    const validDraft = mapExtractionToDraft(valid, EN);
    const invalidDraft = mapExtractionToDraft(invalid, EN);

    // Assert
    expect(validDraft.header.date).toBe("2026-03-05");
    expect(invalidDraft.header.date).toBe("");
  });

  it("should map fasting booleans and absence to the form tri-state", () => {
    // Arrange
    const yes = extraction({ fasting: true });
    const no = extraction({ fasting: false });
    const unset = extraction({});

    // Act
    const yesDraft = mapExtractionToDraft(yes, EN);
    const noDraft = mapExtractionToDraft(no, EN);
    const unsetDraft = mapExtractionToDraft(unset, EN);

    // Assert
    expect(yesDraft.header.fasting).toBe("yes");
    expect(noDraft.header.fasting).toBe("no");
    expect(unsetDraft.header.fasting).toBe("unspecified");
  });

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
