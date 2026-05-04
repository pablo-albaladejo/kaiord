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

// `it`-rooted call detector — same regex shape as the title-extracting
// pair, but only matches the call shape (no title capture). Used by
// `countItCalls` (below) which de-duplicates plain vs each matches via
// match position, so a single it.each(...)(...) is counted once.
const IT_CALL_DETECT_PLAIN_RE = /\bit\b(?:\.(?!each\b)[a-z]+)?\s*\(/g;
const IT_CALL_DETECT_EACH_RE = /\bit\.each\s*\([\s\S]*?\]\s*\)\s*\(/g;

// Public surface kept for backwards-compat with code that just wants
// to grep "is this an it()-call" — a permissive single regex. Use
// `countItCalls(source)` for accurate counts (it dedupes and
// strips string-literal contents).
export const IT_CALL_RE = /\bit\b(?:\.[a-z]+)?\s*\(/g;

// Strip string and template literal contents (replacing with empty
// strings of the same shape) so a literal like `"... it (something)"`
// in a title doesn't get counted as an `it()`-call.
function stripStringLiteralContents(source) {
  return (
    source
      // template literals (handles single-line and multi-line)
      .replace(/`(?:\\.|[^`\\])*`/g, "``")
      // double-quoted strings
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      // single-quoted strings
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
  );
}

// Count it()-rooted calls accurately. Strips string-literal contents
// first so titles like `"settings opens it (twice)"` aren't double-
// counted. Then matches plain + each forms and dedupes by call start
// position so `it.each([])(title)` is counted once, not twice.
export function countItCalls(source) {
  const stripped = stripStringLiteralContents(source);
  const positions = new Set();
  for (const m of stripped.matchAll(IT_CALL_DETECT_EACH_RE)) {
    positions.add(m.index);
  }
  for (const m of stripped.matchAll(IT_CALL_DETECT_PLAIN_RE)) {
    // Skip plain matches that fall INSIDE an each match's range
    // (the each regex already covered them).
    let inside = false;
    for (const m2 of stripped.matchAll(IT_CALL_DETECT_EACH_RE)) {
      if (m.index >= m2.index && m.index < m2.index + m2[0].length) {
        inside = true;
        break;
      }
    }
    if (!inside) positions.add(m.index);
  }
  return positions.size;
}

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
