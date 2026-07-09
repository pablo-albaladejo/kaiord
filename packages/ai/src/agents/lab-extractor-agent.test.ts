import { describe, it, expect } from "vitest";
import { labExtractorAgent } from "./lab-extractor-agent";
import { runGenerateAgent } from "./runtime";
import { mockModelReturning } from "../test-utils/mock-language-model";

const EXTRACTION = {
  date: "2026-05-01",
  labName: "Acme Labs",
  values: [
    {
      label: "Glucose",
      parameterKey: "glucose",
      value: 92,
      unit: "mg/dL",
      refLow: 70,
      refHigh: 100,
    },
    { label: "GPT (ALT)", parameterKey: "alt", value: 30, unit: "U/L" },
  ],
};

const PDF = {
  data: new TextEncoder().encode("%PDF-1.4"),
  mediaType: "application/pdf",
  filename: "report.pdf",
};

describe("labExtractorAgent", () => {
  it("should extract report metadata and parameter rows from a document", async () => {
    // Arrange
    const model = mockModelReturning(EXTRACTION);

    // Act
    const result = await runGenerateAgent(
      labExtractorAgent,
      { files: [PDF] },
      { model }
    );

    // Assert
    expect(result.output.labName).toBe("Acme Labs");
    expect(result.output.values).toHaveLength(2);
  });

  it("should inject the canonical catalog into the system prompt", async () => {
    // Arrange
    const model = mockModelReturning(EXTRACTION);

    // Act
    await runGenerateAgent(labExtractorAgent, { files: [PDF] }, { model });

    // Assert
    const prompt = JSON.stringify(model.doGenerateCalls[0]?.prompt);
    expect(prompt).toContain("glucose");
    expect(prompt).toContain("alt");
  });

  it("should forward the document file part to the model", async () => {
    // Arrange
    const model = mockModelReturning(EXTRACTION);

    // Act
    await runGenerateAgent(labExtractorAgent, { files: [PDF] }, { model });

    // Assert
    const prompt = JSON.stringify(model.doGenerateCalls[0]?.prompt);
    expect(prompt).toContain("application/pdf");
  });
});
