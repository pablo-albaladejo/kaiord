import { describe, expect, it } from "vitest";

import {
  buildUserPrompt,
  PROMPT_VERSION,
  SPANISH_ABBREVIATION_DICTIONARY,
} from "./user-prompt";

describe("PROMPT_VERSION", () => {
  it("should follow semver format", () => {
    // Arrange

    // Act

    // Assert
    expect(PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("SPANISH_ABBREVIATION_DICTIONARY", () => {
  it("should include common coaching abbreviations", () => {
    // Arrange

    // Act

    // Assert
    expect(SPANISH_ABBREVIATION_DICTIONARY).toContain("Z1-Z5");
    expect(SPANISH_ABBREVIATION_DICTIONARY).toContain("CV/VC");
    expect(SPANISH_ABBREVIATION_DICTIONARY).toContain("RI");
  });
});

describe("buildUserPrompt", () => {
  it("should wrap description in XML delimiters", () => {
    // Arrange

    // Act
    const result = buildUserPrompt("running", "Easy 10K", []);

    // Assert
    expect(result).toContain("<coach_description>");
    expect(result).toContain("Easy 10K");
    expect(result).toContain("</coach_description>");
  });

  it("should include sport", () => {
    // Arrange

    // Act
    const result = buildUserPrompt("cycling", "FTP test", []);

    // Assert
    expect(result).toContain("Sport: cycling");
  });

  it("should wrap comments in XML delimiters", () => {
    // Arrange

    // Act
    const result = buildUserPrompt("running", "desc", ["Keep Z2", "Watch HR"]);

    // Assert
    expect(result).toContain("<coach_comment>\nKeep Z2\n</coach_comment>");
    expect(result).toContain("<coach_comment>\nWatch HR\n</coach_comment>");
    expect(result).toContain("Coach notes:");
  });

  it("should omit comments section when empty", () => {
    // Arrange

    // Act
    const result = buildUserPrompt("running", "desc", []);

    // Assert
    expect(result).not.toContain("Coach notes:");
    expect(result).not.toContain("coach_comment");
  });

  it("should include adjustment notes when provided", () => {
    // Arrange

    // Act
    const result = buildUserPrompt("running", "desc", [], "Lower intensity");

    // Assert
    expect(result).toContain("Adjustment notes: Lower intensity");
  });

  it("should omit adjustment notes when undefined", () => {
    // Arrange

    // Act
    const result = buildUserPrompt("running", "desc", []);

    // Assert
    expect(result).not.toContain("Adjustment notes");
  });
});
