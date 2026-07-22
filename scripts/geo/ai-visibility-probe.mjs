#!/usr/bin/env node
// Asks answer engines the discovery questions from reports/seo/queries.json and
// records whether kaiord (vs. competitors) is mentioned or cited — the end-goal
// GEO metric. Providers activate by env var; with none set this is a no-op so
// the weekly workflow can run before any key exists.
//   PERPLEXITY_API_KEY  Perplexity sonar (web-grounded — primary signal)
//   OPENAI_API_KEY      OpenAI Responses API with the web_search tool
// Setup: docs/seo-observatory.md
import { join } from "node:path";
import {
  appendJsonl,
  loadQueries,
  sleep,
  timeseriesDir,
  todayIso,
  writeSnapshot,
} from "./observatory-lib.mjs";

const askPerplexity = async (question) => {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL ?? "sonar",
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!response.ok)
    throw new Error(
      `perplexity -> ${response.status} ${await response.text()}`
    );
  const data = await response.json();
  return {
    answer: data.choices?.[0]?.message?.content ?? "",
    citations: data.citations ?? [],
  };
};

const askOpenAI = async (question) => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      tools: [{ type: "web_search" }],
      input: question,
    }),
  });
  if (!response.ok)
    throw new Error(`openai -> ${response.status} ${await response.text()}`);
  const data = await response.json();
  const answer = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text)
    .join("\n");
  const citations = (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .flatMap((part) => part.annotations ?? [])
    .map((annotation) => annotation.url)
    .filter(Boolean);
  return { answer, citations };
};

const providers = [
  ...(process.env.PERPLEXITY_API_KEY
    ? [{ name: "perplexity", ask: askPerplexity }]
    : []),
  ...(process.env.OPENAI_API_KEY ? [{ name: "openai", ask: askOpenAI }] : []),
];
if (providers.length === 0) {
  console.log(
    "[ai-visibility] no provider keys (PERPLEXITY_API_KEY / OPENAI_API_KEY) — skipping. Setup: docs/seo-observatory.md"
  );
  process.exit(0);
}

const { aiQuestions, competitors } = loadQueries();

for (const provider of providers) {
  const runs = [];
  for (const { id, q } of aiQuestions) {
    try {
      const { answer, citations } = await provider.ask(q);
      const haystack = `${answer}\n${citations.join("\n")}`.toLowerCase();
      const competitorsMentioned = competitors
        .filter((c) => c.match.some((token) => haystack.includes(token)))
        .map((c) => c.name);
      runs.push({
        id,
        q,
        kaiordMentioned: haystack.includes("kaiord"),
        kaiordCited: citations.some((url) =>
          String(url).includes("kaiord.com")
        ),
        competitorsMentioned,
        answer,
        citations,
      });
    } catch (error) {
      console.warn(
        `[ai-visibility] ${provider.name} failed for "${q}": ${error.message}`
      );
      runs.push({ id, q, error: error.message });
    }
    await sleep(1000);
  }

  const answered = runs.filter((r) => r.error === undefined);
  const mentions = answered.filter((r) => r.kaiordMentioned).length;
  const competitorCounts = {};
  for (const run of answered) {
    for (const name of run.competitorsMentioned ?? []) {
      competitorCounts[name] = (competitorCounts[name] ?? 0) + 1;
    }
  }
  const entry = {
    date: todayIso(),
    source: "ai-visibility",
    provider: provider.name,
    questions: answered.length,
    kaiordMentions: mentions,
    mentionRate:
      answered.length === 0
        ? null
        : Number((mentions / answered.length).toFixed(2)),
    citedCount: answered.filter((r) => r.kaiordCited).length,
    topCompetitors: Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
  };

  writeSnapshot(`ai-visibility-${provider.name}-${todayIso()}`, {
    entry,
    runs,
  });
  const appended = appendJsonl(
    join(timeseriesDir, "ai-visibility.jsonl"),
    entry,
    ["date", "source", "provider"]
  );
  console.log(
    `[ai-visibility] ${provider.name} ${appended ? "recorded" : "already recorded today"}: ` +
      `${mentions}/${answered.length} answers mention kaiord`
  );
}
