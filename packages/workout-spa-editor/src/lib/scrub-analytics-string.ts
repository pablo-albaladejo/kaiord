/**
 * Scrubs PII / opaque secret material from a string before forwarding
 * it to a third-party telemetry sink (e.g., the Umami tracker).
 *
 * Five replacements applied in order:
 *   1. UUID v4/v5 → <uuid>
 *   2. Bearer <token-safe-chars> → "Bearer <token>"
 *   3. Email-shaped (Unicode-aware) → <email>
 *   4. Hex run ≥32 chars → <hex>
 *   5. Base64url run ≥40 chars → <token>
 *
 * Rule 2 runs BEFORE rule 5 so a `Bearer <jwt>` is replaced as a
 * single Bearer-token unit (avoiding double-scrub). Rule 4 runs
 * BEFORE rule 5 so a long hex run produces `<hex>`, not `<token>`.
 *
 * Truncation (when `maxLen` is provided) runs AFTER all scrubbing,
 * so placeholders are never chopped mid-token.
 *
 * Out of scope: IPv4/IPv6, phone numbers, filesystem pathnames.
 * The function intentionally over-scrubs (false-positive bias) on
 * long alphanumeric runs without word breaks — see design.md D5.
 */
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-+/=]+/g;
const EMAIL_RE = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const HEX_RE = /[0-9a-f]{32,}/gi;
const BASE64URL_RE = /[A-Za-z0-9_-]{40,}/g;

export function scrubAnalyticsString(input: string, maxLen?: number): string {
  let out = input;
  out = out.replace(UUID_RE, "<uuid>");
  out = out.replace(BEARER_RE, "Bearer <token>");
  out = out.replace(EMAIL_RE, "<email>");
  out = out.replace(HEX_RE, "<hex>");
  out = out.replace(BASE64URL_RE, "<token>");
  if (typeof maxLen === "number" && out.length > maxLen) {
    out = truncateRespectingPlaceholders(out, maxLen);
  }
  return out;
}

const PLACEHOLDERS = ["<uuid>", "<email>", "<hex>", "<token>"];

function truncateRespectingPlaceholders(s: string, maxLen: number): string {
  // If the naive cut at `maxLen` falls INSIDE a placeholder token,
  // back the cut up to before that placeholder so the output never
  // ends with `<u`, `<token` or similar.
  for (const ph of PLACEHOLDERS) {
    const start = s.lastIndexOf(ph, maxLen - 1);
    if (start !== -1 && start < maxLen && start + ph.length > maxLen) {
      return s.slice(0, start);
    }
  }
  return s.slice(0, maxLen);
}
