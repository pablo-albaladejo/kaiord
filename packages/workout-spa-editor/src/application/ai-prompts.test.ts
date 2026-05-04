import { describe, expect, it } from "vitest";

import {
  buildSystemPrompt,
  buildUserPrompt,
  PROMPT_VERSION,
  SPANISH_ABBREVIATION_DICTIONARY,
} from "./ai-prompts";

describe("PROMPT_VERSION", () => {
  it("should follow semver format", () => {
    expect(PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("SPANISH_ABBREVIATION_DICTIONARY", () => {
  it("should include common coaching abbreviations", () => {
    expect(SPANISH_ABBREVIATION_DICTIONARY).toContain("Z1-Z5");
    expect(SPANISH_ABBREVIATION_DICTIONARY).toContain("CV/VC");
    expect(SPANISH_ABBREVIATION_DICTIONARY).toContain("RI");
  });
});

describe("buildSystemPrompt", () => {
  it("should inject zones context into template", () => {
    const zones = "Z1: 120-140bpm\nZ2: 140-160bpm";

    const result = buildSystemPrompt(zones);

    expect(result).toContain("Z1: 120-140bpm");
    expect(result).toContain("Z2: 140-160bpm");
  });

  it("should include prompt injection defense", () => {
    const result = buildSystemPrompt("zones");

    expect(result).toContain("System instructions take priority");
    expect(result).toContain("coach delimiters");
  });

  it("should include Spanish abbreviation dictionary", () => {
    const result = buildSystemPrompt("zones");

    expect(result).toContain("vuelta a la calma");
  });
});

describe("buildUserPrompt", () => {
  it("should wrap description in XML delimiters", () => {
    const result = buildUserPrompt("running", "Easy 10K", []);

    expect(result).toContain("<coach_description>");
    expect(result).toContain("Easy 10K");
    expect(result).toContain("</coach_description>");
  });

  it("should include sport", () => {
    const result = buildUserPrompt("cycling", "FTP test", []);

    expect(result).toContain("Sport: cycling");
  });

  it("should wrap comments in XML delimiters", () => {
    const result = buildUserPrompt("running", "desc", ["Keep Z2", "Watch HR"]);

    expect(result).toContain("<coach_comment>\nKeep Z2\n</coach_comment>");
    expect(result).toContain("<coach_comment>\nWatch HR\n</coach_comment>");
    expect(result).toContain("Coach notes:");
  });

  it("should omit comments section when empty", () => {
    const result = buildUserPrompt("running", "desc", []);

    expect(result).not.toContain("Coach notes:");
    expect(result).not.toContain("coach_comment");
  });

  it("should include adjustment notes when provided", () => {
    const result = buildUserPrompt("running", "desc", [], "Lower intensity");

    expect(result).toContain("Adjustment notes: Lower intensity");
  });

  it("should omit adjustment notes when undefined", () => {
    const result = buildUserPrompt("running", "desc", []);

    expect(result).not.toContain("Adjustment notes");
  });
});
