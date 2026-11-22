// Whether a test file holds a test that really runs under a given title. The
// title must be the first argument of an `it(` / `test(` call in code (not
// in a comment or a string), and neither the call nor any `describe` around
// it may be skipped, todo, conditional, or left out by an `.only` elsewhere
// in the file. A `{ skip }` / `{ todo }` option skips it too.

import { maskSource } from "./js-mask.mjs";

const CALL =
  /(?<![\w$.])(describe|suite|context|it|test|xit|xtest|xdescribe|fit|fdescribe)((?:\s*\.\s*\w+)*)\s*\(/g;
const TESTS = new Set(["it", "test", "xit", "xtest", "fit"]);
const SKIPPING = /\b(skip|todo|skipIf|runIf|each|fails)\b/;
const OPTION_SKIP = /^\s*,\s*\{[^{}]*\b(skip|todo)\s*:/;

const closingParen = (code, open) => {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === "(") depth++;
    else if (code[i] === ")" && --depth === 0) return i;
  }
  return code.length;
};

const unescape = (body) => body.replace(/\\(.)/g, "$1");

const calls = (src) => {
  const { code, literals } = maskSource(src);
  const byStart = new Map(literals.map((l) => [l.start, l]));
  return [...code.matchAll(CALL)].map((m) => {
    const open = m.index + m[0].length - 1;
    const firstArg = open + 1 + /^\s*/.exec(code.slice(open + 1))[0].length;
    const literal = byStart.get(firstArg);
    const title = literal && !literal.open ? unescape(literal.body) : undefined;
    const after = literal ? code.slice(literal.end + 1, literal.end + 400) : "";
    const name = m[1];
    return {
      test: TESTS.has(name),
      title,
      raw: literal?.body,
      start: open,
      end: closingParen(code, open),
      skipped:
        name.startsWith("x") || SKIPPING.test(m[2]) || OPTION_SKIP.test(after),
      only: name.startsWith("f") || /\bonly\b/.test(m[2]),
    };
  });
};

// null when a runnable test has the title, else why it does not count.
export const testRunProblem = (src, title) => {
  const all = calls(src);
  const titled = all.filter(
    (c) => c.test && (c.title === title || c.raw === title)
  );
  if (titled.length === 0) return "no test call with that title in code";
  const anyOnly = all.some((c) => c.only);
  const around = (c) =>
    all.filter((d) => !d.test && d.start < c.start && c.end <= d.end);
  const runs = titled.some((c) => {
    const chain = [c, ...around(c)];
    if (chain.some((d) => d.skipped)) return false;
    return !anyOnly || chain.some((d) => d.only);
  });
  return runs
    ? null
    : "the test is skipped, todo, conditional or excluded by .only";
};
