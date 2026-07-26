/**
 * Kaiord Bridge Core — Plain-JS Profile Snapshot Validator (vendored)
 *
 * Master: packages/_shared/bridge-core/profile-snapshot.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`. Vendored
 * only by bridges with a profile-snapshot feature.
 *
 * Mirrors the Zod schema in @kaiord/core/types/profile-snapshot for the
 * SPA → bridge protocol. Kept hand-rolled (not imported) so the bridge
 * has zero runtime dependency on @kaiord/core; parity with the Zod
 * schema is enforced by a shared fixture set loaded in tests.
 *
 * Security invariants:
 *   - Output objects use Object.create(null) — no prototype.
 *   - Recursive own-key inspection rejects __proto__/constructor/
 *     prototype anywhere in the tree.
 *   - JSON.stringify length cap (8192 UTF-16 code units) enforced first.
 *   - The validator NEVER mutates Object.prototype.
 */

const SNAPSHOT_LENGTH_LIMIT = 8192;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SPORTS = new Set(["cycling", "running", "swimming"]);

const containsPolluted = (input, visited) => {
  if (input === null || typeof input !== "object") return false;
  if (visited.has(input)) return false;
  visited.add(input);
  for (const key of Object.getOwnPropertyNames(input)) {
    if (FORBIDDEN_KEYS.has(key)) return true;
    if (containsPolluted(input[key], visited)) return true;
  }
  return false;
};

const isPositiveInt = (v) =>
  typeof v === "number" && Number.isInteger(v) && v > 0;

const isPositiveNumber = (v) => typeof v === "number" && v > 0;

const isISODateTime = (v) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(v);

const validateProfile = (profile, errors) => {
  if (!profile || typeof profile !== "object") {
    errors.push("profile must be an object");
    return null;
  }
  const out = Object.create(null);
  if (
    typeof profile.name !== "string" ||
    profile.name.length < 1 ||
    profile.name.length > 100
  ) {
    errors.push("profile.name must be a 1..100-char string");
    return null;
  }
  out.name = profile.name;
  if (profile.bodyWeight !== undefined) {
    if (!isPositiveNumber(profile.bodyWeight)) {
      errors.push("profile.bodyWeight must be a positive number");
      return null;
    }
    out.bodyWeight = profile.bodyWeight;
  }
  return out;
};

const validateThresholdsBlock = (
  input,
  allowedKeys,
  validators,
  errors,
  label
) => {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object") {
    errors.push(`${label} must be an object`);
    return null;
  }
  const out = Object.create(null);
  for (const key of Object.getOwnPropertyNames(input)) {
    if (!allowedKeys.has(key)) {
      errors.push(`${label} has unknown key: ${key}`);
      return null;
    }
    if (input[key] !== undefined) {
      if (!validators[key](input[key])) {
        errors.push(`${label}.${key} is invalid`);
        return null;
      }
      out[key] = input[key];
    }
  }
  return out;
};

// Per-sport threshold specs. A Map (not a plain object) so `.get(key)`
// never resolves inherited keys (toString, etc.), preserving the original
// Set-based allow-list's rejection of any unsupported sport key.
const THRESHOLD_SPECS = new Map([
  ["cycling", { keys: new Set(["ftp"]), validators: { ftp: isPositiveInt } }],
  [
    "running",
    {
      keys: new Set(["thresholdPaceSecPerKm", "lthr"]),
      validators: { thresholdPaceSecPerKm: isPositiveInt, lthr: isPositiveInt },
    },
  ],
  [
    "swimming",
    {
      keys: new Set(["cssPaceSecPer100m"]),
      validators: { cssPaceSecPer100m: isPositiveInt },
    },
  ],
]);

const validateThresholds = (thresholds, errors) => {
  if (thresholds === undefined) return Object.create(null);
  if (!thresholds || typeof thresholds !== "object") {
    errors.push("thresholds must be an object");
    return null;
  }
  const out = Object.create(null);
  for (const key of Object.getOwnPropertyNames(thresholds)) {
    const spec = THRESHOLD_SPECS.get(key);
    if (!spec) {
      errors.push(`thresholds has unknown key: ${key}`);
      return null;
    }
    const r = validateThresholdsBlock(
      thresholds[key],
      spec.keys,
      spec.validators,
      errors,
      `thresholds.${key}`
    );
    if (errors.length > 0) return null;
    if (r !== undefined) out[key] = r;
  }
  return out;
};

const validateHeartRate = (hr, errors) => {
  if (hr === undefined) return Object.create(null);
  return validateThresholdsBlock(
    hr,
    new Set(["max", "lthr"]),
    { max: isPositiveInt, lthr: isPositiveInt },
    errors,
    "heartRate"
  );
};

const validateSnapshot = (input) => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid snapshot payload" };
  }
  if (containsPolluted(input, new WeakSet())) {
    return { ok: false, error: "Invalid snapshot payload" };
  }
  let serialized;
  try {
    serialized = JSON.stringify(input);
  } catch {
    return { ok: false, error: "Invalid snapshot payload" };
  }
  if (serialized.length > SNAPSHOT_LENGTH_LIMIT) {
    return { ok: false, error: "Snapshot too large" };
  }

  const errors = [];
  const allowedTopKeys = new Set([
    "schemaVersion",
    "profile",
    "activeSport",
    "thresholds",
    "heartRate",
    "generatedAt",
  ]);
  for (const key of Object.getOwnPropertyNames(input)) {
    if (!allowedTopKeys.has(key)) {
      return { ok: false, error: "Invalid snapshot payload" };
    }
  }
  if (input.schemaVersion !== 1) {
    return { ok: false, error: "Unsupported snapshot schema version" };
  }
  const profile = validateProfile(input.profile, errors);
  if (errors.length > 0)
    return { ok: false, error: "Invalid snapshot payload" };
  if (input.activeSport !== undefined && !SPORTS.has(input.activeSport)) {
    return { ok: false, error: "Invalid snapshot payload" };
  }
  const thresholds = validateThresholds(input.thresholds, errors);
  if (errors.length > 0)
    return { ok: false, error: "Invalid snapshot payload" };
  const heartRate = validateHeartRate(input.heartRate, errors);
  if (errors.length > 0)
    return { ok: false, error: "Invalid snapshot payload" };
  if (!isISODateTime(input.generatedAt)) {
    return { ok: false, error: "Invalid snapshot payload" };
  }

  const out = Object.create(null);
  out.schemaVersion = 1;
  out.profile = profile;
  if (input.activeSport !== undefined) out.activeSport = input.activeSport;
  out.thresholds = thresholds;
  out.heartRate = heartRate;
  out.generatedAt = input.generatedAt;
  return { ok: true, value: out };
};

if (typeof module !== "undefined") {
  module.exports = {
    validateSnapshot,
  };
}

if (typeof self !== "undefined" && typeof module === "undefined") {
  self.validateSnapshot = validateSnapshot;
}
