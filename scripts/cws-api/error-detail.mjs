// Shared helper: read an HTTP error response body for inclusion in a
// CwsStateError message. Strips Bearer/Authorization tokens defensively
// before truncation. Used by both `publish.mjs` and `state.mjs` so the
// redaction behaves identically across CWS API helpers.
//
// Regex order is load-bearing: the more-specific `Authorization: Bearer`
// pattern runs FIRST and consumes the full span in one pass, so the
// bare `Bearer` pattern only fires on tokens outside an Authorization
// header. No `/i` flag — CWS error responses use canonical HTTP casing
// and a case-insensitive match would widen the regex beyond intent.

export async function readErrorDetail(res) {
  try {
    const text = await res.text();
    const redacted = text
      .replace(
        /Authorization:\s*Bearer\s+[A-Za-z0-9._\-\/=]+/g,
        "Authorization: [redacted]"
      )
      .replace(/\bBearer\s+[A-Za-z0-9._\-\/=]+/g, "Bearer [redacted]");
    return redacted.replace(/\s+/g, " ").slice(0, 400);
  } catch {
    return "(no body)";
  }
}
