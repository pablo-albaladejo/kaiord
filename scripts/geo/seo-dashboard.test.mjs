import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { loadQueries } from "./observatory-lib.mjs";
import {
  monthlyAiVisibility,
  renderDashboard,
  renderMonthlyAiVisibility,
} from "./seo-dashboard.mjs";

const probe = (date, provider, questions, mentions, extra = {}) => ({
  date,
  source: "ai-visibility",
  provider,
  questions,
  kaiordMentions: mentions,
  citedCount: 0,
  ...extra,
});

describe("monthlyAiVisibility", () => {
  it("should roll weekly rows up per provider and month, newest month first", () => {
    // Arrange
    const rows = [
      probe("2026-08-24", "perplexity", 5, 0),
      probe("2026-09-07", "perplexity", 5, 1),
      probe("2026-09-14", "perplexity", 5, 0),
      probe("2026-09-14", "openai", 5, 2),
    ];

    // Act
    const monthly = monthlyAiVisibility(rows);

    // Assert
    assert.deepEqual(
      monthly.map((m) => [
        m.month,
        m.provider,
        m.runs,
        m.mentions,
        m.questions,
      ]),
      [
        ["2026-09", "openai", 1, 2, 5],
        ["2026-09", "perplexity", 2, 1, 10],
        ["2026-08", "perplexity", 1, 0, 5],
      ]
    );
  });

  it("should sum the EN and ES halves of the panel from byLang", () => {
    // Arrange
    const byLang = (en, es) => ({
      byLang: {
        en: { questions: 15, kaiordMentions: en },
        es: { questions: 10, kaiordMentions: es },
      },
    });
    const rows = [
      probe("2026-10-05", "perplexity", 25, 3, byLang(2, 1)),
      probe("2026-10-12", "perplexity", 25, 1, byLang(1, 0)),
    ];

    // Act
    const [october] = monthlyAiVisibility(rows);

    // Assert
    assert.deepEqual(october.byLang, {
      en: { questions: 30, mentions: 3 },
      es: { questions: 20, mentions: 1 },
    });
  });

  it("should keep only the most recent months", () => {
    // Arrange
    const rows = ["2026-07-01", "2026-08-01", "2026-09-01"].map((d) =>
      probe(d, "perplexity", 5, 0)
    );

    // Act
    const monthly = monthlyAiVisibility(rows, 2);

    // Assert
    assert.deepEqual(
      monthly.map((m) => m.month),
      ["2026-09", "2026-08"]
    );
  });
});

describe("renderMonthlyAiVisibility", () => {
  it("should render one table row per month and provider with the rate", () => {
    // Arrange
    const rows = [
      probe("2026-09-07", "perplexity", 5, 1),
      probe("2026-09-14", "perplexity", 5, 0),
    ];

    // Act
    const lines = renderMonthlyAiVisibility(rows);

    // Assert
    assert.equal(lines[0], "## Monthly AI visibility");
    assert.ok(
      lines.includes("| 2026-09 | perplexity | 2 | 1/10 | 0.1 | 0 | — | — |")
    );
  });

  it("should say there is no data instead of rendering an empty table", () => {
    // Arrange
    const rows = [];

    // Act
    const lines = renderMonthlyAiVisibility(rows);

    // Assert
    assert.ok(lines.includes("_No AI-visibility data yet._"));
    assert.ok(!lines.some((l) => l.startsWith("| Month")));
  });
});

describe("renderDashboard", () => {
  it("should include the monthly view in the generated dashboard", () => {
    // Arrange
    const input = {
      gsc: [],
      bing: [],
      serp: [],
      aiVisibility: [probe("2026-09-21", "perplexity", 5, 1)],
      serpQueries: [],
      directoryStatus: { checkedAt: "2026-09-28", directories: {} },
      now: new Date("2026-09-28T10:00:00Z"),
    };

    // Act
    const markdown = renderDashboard(input);

    // Assert
    assert.match(markdown, /^_Generated 2026-09-28 10:00 UTC/m);
    assert.match(
      markdown,
      /## Monthly AI visibility\n\n\| Month \| Provider[^\n]*\n[^\n]*\n\| 2026-09 \| perplexity \| 1 \| 1\/5 \| 0\.2 \|/
    );
  });
});

describe("queries.json AI panel", () => {
  const { aiQuestions } = loadQueries();
  const panel = aiQuestions.filter((q) => q.id.startsWith("panel-"));

  it("should hold the 10 audit panel prompts in both EN and ES", () => {
    // Arrange
    const expected = Array.from({ length: 10 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return [`panel-${n}-en`, `panel-${n}-es`];
    }).flat();

    // Act
    const ids = panel.map((q) => q.id);

    // Assert
    assert.deepEqual(ids, expected);
    for (const q of panel) assert.equal(q.lang, q.id.slice(-2));
  });

  it("should not repeat an id or a question", () => {
    // Arrange
    const norm = (text) =>
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    // Act
    const ids = new Set(aiQuestions.map((q) => q.id));
    const questions = new Set(aiQuestions.map((q) => norm(q.q)));

    // Assert
    assert.equal(ids.size, aiQuestions.length);
    assert.equal(questions.size, aiQuestions.length);
  });

  it("should give every question a language the probe can split on", () => {
    // Arrange
    const langs = new Set(["en", "es"]);

    // Act
    const missing = aiQuestions.filter((q) => !langs.has(q.lang));

    // Assert
    assert.deepEqual(missing, []);
  });
});
