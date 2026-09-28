import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { summarizeRuns } from "./ai-visibility-summary.mjs";

const questions = [
  { id: "convert-fit", lang: "en", core: true },
  { id: "mcp-workout", lang: "en", core: true },
  { id: "panel-01-es", lang: "es" },
  { id: "panel-07-en", lang: "en", brand: true },
  { id: "panel-07-es", lang: "es", brand: true },
];

const run = (id, lang, mentioned, extra = {}) => ({
  id,
  lang,
  kaiordMentioned: mentioned,
  kaiordCited: false,
  competitorsMentioned: [],
  ...extra,
});

const summarize = (runs) =>
  summarizeRuns({
    runs,
    questions,
    date: "2026-10-05",
    provider: "perplexity",
  });

describe("summarizeRuns", () => {
  it("should leave the brand prompts out of mentionRate", () => {
    // Arrange
    const runs = [
      run("convert-fit", "en", false),
      run("mcp-workout", "en", false),
      run("panel-01-es", "es", true),
      run("panel-07-en", "en", true, { kaiordCited: true }),
      run("panel-07-es", "es", true),
    ];

    // Act
    const entry = summarize(runs);

    // Assert
    assert.deepEqual(
      [entry.questions, entry.kaiordMentions, entry.mentionRate],
      [3, 1, 0.33]
    );
    assert.equal(entry.citedCount, 0);
    assert.deepEqual(entry.brand, { questions: 2, kaiordMentions: 2 });
  });

  it("should keep the brand prompts out of the EN/ES split", () => {
    // Arrange
    const runs = [
      run("convert-fit", "en", true),
      run("panel-01-es", "es", false),
      run("panel-07-en", "en", true),
      run("panel-07-es", "es", true),
    ];

    // Act
    const entry = summarize(runs);

    // Assert
    assert.deepEqual(entry.byLang, {
      en: { questions: 1, kaiordMentions: 1 },
      es: { questions: 1, kaiordMentions: 0 },
    });
  });

  it("should give a core rate over the core prompts only", () => {
    // Arrange
    const runs = [
      run("convert-fit", "en", true),
      run("mcp-workout", "en", false),
      run("panel-01-es", "es", true),
    ];

    // Act
    const entry = summarize(runs);

    // Assert
    assert.deepEqual(entry.core, {
      questions: 2,
      kaiordMentions: 1,
      mentionRate: 0.5,
      citedCount: 0,
    });
    assert.equal(entry.mentionRate, 0.67);
  });

  it("should leave failed prompts out of every denominator", () => {
    // Arrange
    const runs = [
      run("convert-fit", "en", true),
      { id: "mcp-workout", lang: "en", error: "perplexity -> 500" },
    ];

    // Act
    const entry = summarize(runs);

    // Assert
    assert.deepEqual([entry.questions, entry.core.questions], [1, 1]);
  });

  it("should report no rate rather than zero when nothing was answered", () => {
    // Arrange
    const runs = [];

    // Act
    const entry = summarize(runs);

    // Assert
    assert.equal(entry.mentionRate, null);
    assert.equal(entry.core.mentionRate, null);
  });
});
