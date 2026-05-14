/**
 * Local ESLint rule — no-narrative-comments.
 *
 * Bans comments that narrate code history, reference PRs/issues, justify
 * extraction events for the per-file line cap, or label "re-export" shims.
 *
 * See `.omc/specs/deep-dive-cleanup-narrative-comments.md` for the full
 * category breakdown and `.omc/plans/ralplan-no-narrative-comments.md` for
 * the recalibrated regex set against the live corpus.
 *
 * Auto-fix: removes the comment AND the trailing newline when the comment
 * occupies its own line (`isOwnLine`). Mid-line comments are removed
 * in-place without touching the surrounding tokens.
 */

const PATTERNS = [
  // CAT-A: PR/feature-slug references in JSDoc.
  { id: "CAT-A", re: /(^|\s)Feature:.*\bpr\d+/i, mode: "substring" },
  { id: "CAT-A", re: /\b0\d-pr\d+\b/i, mode: "substring" },

  // CAT-B (broadened): any comment containing "Extracted from". The
  // held-out Dexie path has 0 occurrences of this phrase, so the
  // broadening is corpus-safe.
  { id: "CAT-B", re: /\bExtracted from\b/i, mode: "substring" },

  // CAT-C (strict whole-trim): standalone temporal narration whose
  // ENTIRE trimmed body is the temporal phrase. Kept for regression
  // prevention only; live corpus produces 0 hits.
  {
    id: "CAT-C",
    re: /^(previously\s+(was|were|did|asserted|behavior)|used to\s+(be|do|have|encode)|originally\s+(was|did))[\s.]*$/i,
    mode: "whole-trim",
  },

  // CAT-D (broadened with back-compat carve-out): any comment
  // containing "Re-export" EXCEPT those that also mention
  // "backwards compatibility" / "back-compat" — those are
  // legitimate back-compat invariants. Word-bounded `Re-export`
  // does NOT match `Re-exported` past-tense, so dexie-migrations.ts
  // is naturally spared. NO trailing `\b` on the inner alternation —
  // "backwards compat**ibility**" has word chars after "compat".
  {
    id: "CAT-D",
    re: /\bRe-export\b(?!.*(?:backwards?\s+compat|back-compat))/i,
    mode: "substring",
  },
];

const noNarrativeComments = {
  meta: {
    type: "problem",
    fixable: "code",
    schema: [],
    messages: {
      narrative:
        "Narrative/history-telling comments are not allowed. " +
        "Remove this comment (its content belongs in PR descriptions or git history).",
    },
  },
  create(context) {
    const source = context.sourceCode;
    return {
      Program() {
        for (const comment of source.getAllComments()) {
          const text = comment.value.trim();
          const hit = PATTERNS.find((p) =>
            p.mode === "whole-trim" ? p.re.test(text) : p.re.test(comment.value)
          );
          if (!hit) continue;
          context.report({
            node: comment,
            messageId: "narrative",
            fix(fixer) {
              const [start, end] = comment.range;
              const lineStart = source.getIndexFromLoc({
                line: comment.loc.start.line,
                column: 0,
              });
              const nextChar = source.text[end];
              const removeEnd = nextChar === "\n" ? end + 1 : end;
              const isOwnLine =
                source.text.slice(lineStart, start).trim() === "";
              return fixer.removeRange(
                isOwnLine ? [lineStart, removeEnd] : [start, end]
              );
            },
          });
        }
      },
    };
  },
};

export default noNarrativeComments;
