/**
 * Kaiord Bridge Core — The answer a thin Bridge hands the App (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-answer.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * A `request` is answered `{ status, contentType, body }`, the Platform's
 * answer otherwise unread, except that every secret bound to the athlete's
 * Session is removed first (docs/adr/0002: a Session token never travels to
 * Kaiord):
 *   - HTML: every `<input>` and `<meta>` whose name says token, csrf, xsrf,
 *     session or nonce, and the value of an inline `csrfToken`/`_token`
 *     string, the same in HTML that a JSON answer wraps;
 *   - JSON: every member whose key is a credential name (`_token`,
 *     `csrf_token`, `access_token`, `sessionId`, `authorization`, …).
 * An answer with nothing to remove is handed over byte for byte. Cookies
 * never pass: the transports never read a `set-cookie` header.
 *
 * A failed request becomes the Error the envelope serialises: the
 * transport's message (or the fallback with the status), the status, and
 * needsReauth only when the transport set it.
 *
 * This module holds ZERO identity: no host names, bridge ids or paths.
 */

// Wrapped so its names never meet a consuming worker's own top-level
// declarations: importScripts shares one global lexical scope.
const bridgeAnswer = (() => {
  const SECRET_FIELD = /token|csrf|xsrf|session|nonce/i;
  const SECRET_KEY =
    /^(?:_token|_csrf|csrf|xsrf|(?:csrf|xsrf|access|refresh|id|auth|session|authenticity)[-_]?token|token|csrfmiddlewaretoken|session[-_]?id|sessionid|jsessionid|phpsessid|api[-_]?key|authorization|cookie|set-cookie|password)$/i;
  const TAG = /<(input|meta)\b[^>]*>/gi;
  const NAME_ATTR = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
  const INLINE_TOKEN =
    /(\b(?:_token|csrf[-_]?token|xsrf[-_]?token|x-csrf-token|x-xsrf-token)\b["']?\s*[:=]\s*)(["'])[^"'\\\n]*\2/gi;
  const JSON_TYPE = /\bjson\b/i;

  const isSecretTag = (tag) => {
    const m = NAME_ATTR.exec(tag);
    return !!m && SECRET_FIELD.test(m[1] ?? m[2] ?? m[3] ?? "");
  };

  const stripHtml = (text) =>
    text
      .replace(TAG, (tag) => (isSecretTag(tag) ? "" : tag))
      .replace(INLINE_TOKEN, "$1$2$2");

  // Returns the value with its secrets removed, and whether any was.
  const stripValue = (value) => {
    if (typeof value === "string") {
      const next = stripHtml(value);
      return { value: next, changed: next !== value };
    }
    if (value === null || typeof value !== "object") {
      return { value, changed: false };
    }
    let changed = false;
    const walk = (v) => {
      const r = stripValue(v);
      changed = changed || r.changed;
      return r.value;
    };
    if (Array.isArray(value)) return { value: value.map(walk), changed };
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) changed = true;
      else out[key] = walk(v);
    }
    return { value: out, changed };
  };

  const parseJson = (body) => {
    try {
      return { ok: true, value: JSON.parse(body) };
    } catch {
      return { ok: false };
    }
  };

  const stripSessionSecrets = (contentType, body) => {
    if (typeof body !== "string" || body === "") return body;
    const json = JSON_TYPE.test(contentType || "") ? parseJson(body) : null;
    if (!json?.ok) return stripHtml(body);
    const { value, changed } = stripValue(json.value);
    return changed ? JSON.stringify(value) : body;
  };

  const toAnswer = (res) => ({
    status: res.status,
    contentType: res.contentType,
    body: stripSessionSecrets(res.contentType, res.body),
  });

  const toBridgeError = (res, fallback = "Request failed") => {
    const status = typeof res?.status === "number" ? res.status : undefined;
    const err = new Error(
      res?.error ?? `${fallback}${status ? `: ${status}` : ""}`
    );
    if (status !== undefined) err.status = status;
    if (res?.needsReauth) err.needsReauth = true;
    return err;
  };

  return { stripSessionSecrets, toAnswer, toBridgeError };
})();

if (typeof module !== "undefined") {
  module.exports = bridgeAnswer;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgeAnswer = bridgeAnswer;
}
