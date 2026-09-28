import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { loadQueries } from "./observatory-lib.mjs";
import {
  coreRate,
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

  it("should count a legacy row without byLang as English", () => {
    // Arrange
    const rows = [
      probe("2026-09-14", "perplexity", 5, 1),
      probe("2026-09-28", "perplexity", 18, 2, {
        byLang: {
          en: { questions: 9, kaiordMentions: 2 },
          es: { questions: 9, kaiordMentions: 0 },
        },
      }),
    ];

    // Act
    const [september] = monthlyAiVisibility(rows);

    // Assert
    assert.deepEqual(september.byLang, {
      en: { questions: 14, mentions: 3 },
      es: { questions: 9, mentions: 0 },
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
      lines.includes("| 2026-09 | perplexity | 2 | 1/10 | 0.1 | 0 | 1/10 | — |")
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
      aiVisibility: [
        probe("2026-09-21", "perplexity", 5, 1, { mentionRate: 0.2 }),
      ],
      serpQueries: [],
      directoryStatus: { checkedAt: "2026-09-28", directories: {} },
      now: new Date("2026-09-28T10:00:00Z"),
    };

    // Act
    const markdown = renderDashboard(input);

    // Assert
    assert.match(markdown, /^_Generated 2026-09-28 10:00 UTC/m);
    assert.match(markdown, /## KPI denominators\n\n_Since 2026-09-28:_/);
    assert.match(
      markdown,
      /_Mentioned_ means the answer text \*\*or one of its cited URLs\*\*/
    );
    assert.match(
      markdown,
      /\| AI answer-engine mention rate \(core 5 prompts\) \| perplexity 0\.2 \|/
    );
    assert.match(
      markdown,
      /## Monthly AI visibility\n\n\| Month \| Provider[^\n]*\n[^\n]*\n\| 2026-09 \| perplexity \| 1 \| 1\/5 \| 0\.2 \|/
    );
  });
});

describe("coreRate", () => {
  it("should use the core rate, not the whole-panel rate", () => {
    // Arrange
    const row = probe("2026-10-05", "perplexity", 18, 9, {
      mentionRate: 0.5,
      core: { questions: 5, kaiordMentions: 1, mentionRate: 0.2 },
    });

    // Act
    const rate = coreRate(row);

    // Assert
    assert.equal(rate, 0.2);
  });

  it("should read a pre-panel row's rate as its core rate", () => {
    // Arrange
    const row = probe("2026-09-21", "perplexity", 5, 1, { mentionRate: 0.2 });

    // Act
    const rate = coreRate(row);

    // Assert
    assert.equal(rate, 0.2);
  });

  it("should keep a null core rate when every core prompt failed", () => {
    // Arrange
    const row = probe("2026-10-05", "perplexity", 13, 4, {
      mentionRate: 0.31,
      core: { questions: 0, kaiordMentions: 0, mentionRate: null },
    });

    // Act
    const rate = coreRate(row);

    // Assert
    assert.equal(rate, null);
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

  it("should flag the brand prompts and the 5 original core prompts", () => {
    // Arrange
    const ids = (flag) =>
      aiQuestions.filter((q) => q[flag] === true).map((q) => q.id);

    // Act
    const brand = ids("brand");
    const core = ids("core");

    // Assert
    assert.deepEqual(brand, ["panel-07-en", "panel-07-es"]);
    assert.deepEqual(core, [
      "convert-fit",
      "mcp-workout",
      "ts-fit-lib",
      "garmin-connect-sync",
      "workout-toolkit",
    ]);
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
