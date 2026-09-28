// Rolls one provider's probe runs up into the ai-visibility.jsonl entry.
//
// KPI denominators (2026-09-28):
//   - brand prompts (`brand: true` in queries.json, "What is Kaiord?") name
//     kaiord in the question, so any answer mentions it. They are counted
//     apart (`brand`) and never enter `questions`, `kaiordMentions`,
//     `mentionRate`, `citedCount` or `byLang`;
//   - `mentionRate` is over every other answered prompt (the whole panel);
//   - `core` is over the 5 `core: true` prompts only: the question set every
//     row before the panel was measured on (2026-07-22 to 2026-09-21), so it
//     stays comparable across the change. The dashboard's KPI row uses it.
const tally = (runs) => {
  const mentions = runs.filter((r) => r.kaiordMentioned).length;
  return {
    questions: runs.length,
    kaiordMentions: mentions,
    mentionRate:
      runs.length === 0 ? null : Number((mentions / runs.length).toFixed(2)),
    citedCount: runs.filter((r) => r.kaiordCited).length,
  };
};

export function summarizeRuns({ runs, questions, date, provider }) {
  const flags = new Map(questions.map((q) => [q.id, q]));
  const answered = runs.filter((r) => r.error === undefined);
  const brand = answered.filter((r) => flags.get(r.id)?.brand === true);
  const panel = answered.filter((r) => flags.get(r.id)?.brand !== true);
  const core = panel.filter((r) => flags.get(r.id)?.core === true);

  const competitorCounts = {};
  for (const run of panel) {
    for (const name of run.competitorsMentioned ?? []) {
      competitorCounts[name] = (competitorCounts[name] ?? 0) + 1;
    }
  }
  // Per-language split, so the EN and ES halves of the audit panel can be
  // read apart in the dashboard's monthly view.
  const byLang = {};
  for (const run of panel) {
    const lang = run.lang ?? "en";
    byLang[lang] ??= { questions: 0, kaiordMentions: 0 };
    byLang[lang].questions += 1;
    if (run.kaiordMentioned) byLang[lang].kaiordMentions += 1;
  }
  return {
    date,
    source: "ai-visibility",
    provider,
    ...tally(panel),
    core: tally(core),
    brand: {
      questions: brand.length,
      kaiordMentions: brand.filter((r) => r.kaiordMentioned).length,
    },
    byLang,
    topCompetitors: Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
  };
}
