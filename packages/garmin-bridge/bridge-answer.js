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
 * Then the personal fields no Connector reads, as the extension declares
 * them (its `personal-fields.js`): a JSON member, or an HTML form control
 * (`<input>`, or a `<select>` / `<textarea>` with its content), whose name
 * is on the list, compared in lower case without `_` or `-`. This is
 * trimming by name, never reading: no value is looked at, no member is
 * moved, and text outside a named field is left as it came.
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
  const CONTAINER = /<(select|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
  const NO_FIELDS = Object.freeze({ json: [], html: [] });

  const normalize = (name) => String(name).toLowerCase().replace(/[-_]/g, "");
  const nameOf = (tag) => {
    const m = NAME_ATTR.exec(tag);
    return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
  };

  const isSecretTag = (tag) => {
    const name = nameOf(tag);
    return name !== null && SECRET_FIELD.test(name);
  };

  // `personal` is a Set of normalized names; an empty one removes nothing.
  const isPersonalTag = (tag, personal) => {
    const name = nameOf(tag);
    return name !== null && personal.has(normalize(name));
  };

  const stripHtml = (text, personal) =>
    text
      .replace(CONTAINER, (el) =>
        isPersonalTag(el.slice(0, el.indexOf(">") + 1), personal) ? "" : el
      )
      .replace(TAG, (tag) =>
        isSecretTag(tag) ||
        (/^<input/i.test(tag) && isPersonalTag(tag, personal))
          ? ""
          : tag
      )
      .replace(INLINE_TOKEN, "$1$2$2");

  // Returns the value with its secrets removed, and whether any was.
  const stripValue = (value, fields) => {
    if (typeof value === "string") {
      const next = stripHtml(value, fields.html);
      return { value: next, changed: next !== value };
    }
    if (value === null || typeof value !== "object") {
      return { value, changed: false };
    }
    let changed = false;
    const walk = (v) => {
      const r = stripValue(v, fields);
      changed = changed || r.changed;
      return r.value;
    };
    if (Array.isArray(value)) return { value: value.map(walk), changed };
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (SECRET_KEY.test(key) || fields.json.has(normalize(key))) {
        changed = true;
      } else out[key] = walk(v);
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

  const toSets = (personal) => ({
    json: new Set((personal?.json ?? []).map(normalize)),
    html: new Set((personal?.html ?? []).map(normalize)),
  });

  const stripSessionSecrets = (contentType, body, personal = NO_FIELDS) => {
    if (typeof body !== "string" || body === "") return body;
    const fields = toSets(personal);
    const json = JSON_TYPE.test(contentType || "") ? parseJson(body) : null;
    if (!json?.ok) return stripHtml(body, fields.html);
    const { value, changed } = stripValue(json.value, fields);
    return changed ? JSON.stringify(value) : body;
  };

  // `personal`: the extension's declared personal fields (`json`, `html`).
  const toAnswer = (res, personal = NO_FIELDS) => ({
    status: res.status,
    contentType: res.contentType,
    body: stripSessionSecrets(res.contentType, res.body, personal),
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
