// Shared title-extraction logic for the test-convention scripts.
//
// Two regex passes union to avoid the it.each([...])("title") pitfall
// where a naive single-regex implementation falsely captures a string
// literal nested inside the it.each table (e.g., `["pending"]`) as the
// title.
//
// Used by:
//   scripts/check-test-title-should.mjs
//   scripts/check-test-aaa.mjs
//   scripts/measure-it-titles-histogram.mjs
//   scripts/bootstrap-test-conventions-allowlists.mjs
//   scripts/codemod-should-prefix.mjs

// Plain `it(...)`, `it.skip(...)`, `it.only(...)`, `it.todo(...)`,
// `it.fails(...)`, `it.concurrent(...)`, etc. — EXCLUDES `.each` to
// avoid double-matching the it.each(arr)(title) outer call.
//
// `(?!each\b)` negative lookahead prevents `.each` from matching this
// pattern; that case is handled by IT_EACH_TITLE_RE below.
const IT_TITLE_RE =
  /\bit\b(?:\.(?!each\b)[a-z]+)?\s*\(\s*(["'`])([A-Za-z][^"'`]*)\1/g;

// `it.each([...])(title)` — the array can contain quoted strings, so
// we MUST consume `[\s\S]*?\]` before the closing `)` to skip past
// any nested `"x"` values that would otherwise be captured as the
// title by IT_TITLE_RE.
const IT_EACH_TITLE_RE =
  /\bit\.each\s*\([\s\S]*?\]\s*\)\s*\(\s*(["'`])([A-Za-z][^"'`]*)\1/g;

// `it`-rooted call detector (no title extraction). Matches both plain
// and .each forms via the bare prefix; only used to count occurrences
// for AAA heuristic.
export const IT_CALL_RE = /\bit\b(?:\.[a-z]+)?\s*\(/g;

// Yield { quote, title, titleStart } for every `it`-rooted call in
// `source`, deduped by start position. titleStart is the source index
// of the first character INSIDE the opening quote.
export function* findItTitles(source) {
  const seen = new Set();
  function* run(re) {
    for (const match of source.matchAll(re)) {
      const quote = match[1];
      const title = match[2];
      const titleStart =
        match.index + match[0].lastIndexOf(`${quote}${title}${quote}`) + 1;
      if (seen.has(titleStart)) continue;
      seen.add(titleStart);
      yield {
        quote,
        title,
        titleStart,
        fullMatch: match[0],
        matchIndex: match.index,
      };
    }
  }
  // Order matters: it.each first so its title wins over any plain
  // match the IT_TITLE_RE might have made on the same outer call.
  yield* run(IT_EACH_TITLE_RE);
  yield* run(IT_TITLE_RE);
}
