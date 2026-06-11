/**
 * Stuck-draft retry tier state machine.
 *
 * Issue bodies carry a single marker line:
 *
 *     RETRY_COUNT: <integer>
 *
 * Contract:
 *   - parseRetryCount(body) returns the integer value, or null when:
 *       * the marker is missing entirely (fresh issue, human triager body)
 *       * the value is malformed (non-integer, empty, NaN)
 *       * the marker line was rewritten by a human and no longer matches
 *     parseRetryCount MUST NOT throw on any input.
 *
 *   - bumpRetryCount(body) returns a new body string:
 *       * if marker present with parseable integer n, replaces with n+1
 *       * if marker missing or unparseable, appends `RETRY_COUNT: 0`
 *       * sentinel `-1` is preserved (does not bump): an escalated draft
 *         stays escalated until a human resets it.
 *
 * Re-stick after a human close: if a human closes the issue manually and
 * the draft sticks again later, a NEW issue opens at Tier 1 (the close is
 * an explicit human signal). Acceptable noise.
 *
 * Tolerances: `\r\n` line endings, leading/trailing whitespace on the
 * marker line, and bot-reformatted bodies (extra blank lines around the
 * marker) all parse correctly.
 */

const MARKER_RE = /^[ \t]*RETRY_COUNT[ \t]*:[ \t]*(-?\d+)[ \t]*$/m;

export function parseRetryCount(issueBody) {
  if (typeof issueBody !== "string" || issueBody.length === 0) return null;
  const normalized = issueBody.replace(/\r\n/g, "\n");
  const match = MARKER_RE.exec(normalized);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  if (!Number.isInteger(n)) return null;
  return n;
}

export function bumpRetryCount(issueBody) {
  const base = typeof issueBody === "string" ? issueBody : "";
  const normalized = base.replace(/\r\n/g, "\n");
  const current = parseRetryCount(normalized);
  if (current === -1) return normalized;
  if (current === null) {
    const sep =
      normalized.length === 0 || normalized.endsWith("\n") ? "" : "\n";
    return `${normalized}${sep}RETRY_COUNT: 0\n`;
  }
  const next = current + 1;
  return normalized.replace(MARKER_RE, `RETRY_COUNT: ${next}`);
}
