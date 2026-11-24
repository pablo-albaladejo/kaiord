/**
 * Kaiord Bridge Core — Request gate (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-request-gate.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`
 * (parity guard: scripts/check-bridge-core-parity.test.mjs).
 *
 * The one gate of a thin Bridge's `request` action
 * (docs/adr/0004-thin-bridge-smart-connector.md): a message is admitted only
 * when it carries `method`, `path` and, for an entry that declares one, a
 * `body`, nothing else; when method + path match an entry of the bridge's
 * closed list; and when that body matches the schema the entry names. A body
 * is refused on every entry that declares none, so the extension never
 * forwards what it was not told to expect. Anything else is refused with
 * `retryable: false` before any request is sent.
 *
 * This module holds ZERO identity: the closed list and the body schemas
 * belong to the consuming bridge.
 */

// Wrapped so its names never meet a consuming worker's own top-level
// declarations: importScripts shares one global lexical scope.
const bridgeRequestGate = (() => {
  const REQUEST_KEYS = ["action", "method", "path", "body"];
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  const refuseRequest = () => {
    const err = new Error("Request not allowed");
    err.retryable = false;
    return err;
  };

  const isPlainObject = (v) =>
    v !== null && typeof v === "object" && !Array.isArray(v);

  // A real calendar date, not merely the shape (refuses 2026-02-30).
  const isIsoDate = (v) => {
    if (typeof v !== "string" || !ISO_DATE.test(v)) return false;
    const ms = Date.parse(`${v}T00:00:00Z`);
    return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === v;
  };

  const jsonLength = (v) => {
    try {
      return JSON.stringify(v)?.length ?? Infinity;
    } catch {
      return Infinity;
    }
  };

  const inRange = (n, { min = -Infinity, max = Infinity }) =>
    n >= min && n <= max;

  const matchesObject = (value, fields) => {
    if (!isPlainObject(value)) return false;
    const keys = Object.keys(value);
    if (keys.some((k) => !Object.hasOwn(fields, k))) return false;
    return Object.entries(fields).every(([key, shape]) =>
      Object.hasOwn(value, key)
        ? matchesShape(value[key], shape)
        : !!shape.optional
    );
  };

  const CHECKS = {
    string: (v, s) =>
      typeof v === "string" &&
      inRange(v.length, s) &&
      (!s.pattern || s.pattern.test(v)),
    number: (v, s) =>
      typeof v === "number" && Number.isFinite(v) && inRange(v, s),
    integer: (v, s) => Number.isSafeInteger(v) && inRange(v, s),
    boolean: (v) => typeof v === "boolean",
    date: (v) => isIsoDate(v),
    literal: (v, s) => v === s.value,
    bytes: (v, s) =>
      Array.isArray(v) &&
      inRange(v.length, s) &&
      v.every((b) => Number.isInteger(b) && b >= 0 && b <= 255),
    array: (v, s) =>
      Array.isArray(v) &&
      inRange(v.length, s) &&
      v.every((item) => matchesShape(item, s.items)),
    object: (v, s) => matchesObject(v, s.fields),
    json: (v, s) => jsonLength(v) <= (s.maxChars ?? Infinity),
    anyOf: (v, s) => s.of.some((shape) => matchesShape(v, shape)),
    custom: (v, s) => s.test(v) === true,
  };

  const matchesShape = (value, shape) => {
    if (value === null && shape.nullable) return true;
    const check = CHECKS[shape.type];
    return typeof check === "function" && check(value, shape);
  };

  const createRequestGate =
    ({ allowed, bodySchemas = {} }) =>
    (message) => {
      const { method, path, body } = message ?? {};
      const keys = Object.keys(message ?? {});
      if (keys.some((k) => !REQUEST_KEYS.includes(k))) throw refuseRequest();
      if (typeof method !== "string" || typeof path !== "string") {
        throw refuseRequest();
      }
      const rule = allowed.find(
        (r) => r.method === method && r.pattern.test(path)
      );
      if (!rule) throw refuseRequest();
      const hasBody = Object.hasOwn(message, "body");
      if (!rule.body) {
        if (hasBody) throw refuseRequest();
        return { method, path };
      }
      const schema = bodySchemas[rule.body];
      if (!hasBody || !schema || !matchesShape(body, schema))
        throw refuseRequest();
      return { method, path, body };
    };

  return { createRequestGate, matchesShape, isIsoDate, refuseRequest };
})();

if (typeof module !== "undefined") {
  module.exports = bridgeRequestGate;
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.bridgeRequestGate = bridgeRequestGate;
}
