#!/usr/bin/env node
// R-OverridesStale — every entry in `package.json#pnpm.overrides` MUST be
// either still-required (some transitive dep would resolve to a vulnerable
// version without the override) or explicitly allowlisted in
// scripts/README.md inside the `<!-- overrides-allowlist:start -->` /
// `<!-- overrides-allowlist:end -->` block with a "Why kept" justification.
//
// Algorithm (deterministic, lockfile + node_modules/.pnpm only — no network):
//
// 1. Parse root package.json#pnpm.overrides. Each KEY is `<name>(@<vuln>)?`
//    (bare name => vuln range = "*"). VALUE is the patched range.
// 2. Read pnpm-lock.yaml; collect installed snapshot versions of <name>.
// 3. Re-resolve without override: enumerate every parent under
//    node_modules/.pnpm/<parent>/node_modules/<name>/package.json — read the
//    parent's package.json `dependencies[name]` (also peerDependencies and
//    optionalDependencies; devDependencies are NOT installed transitively so
//    they don't influence resolution and are excluded) to recover the
//    ORIGINAL specifier the parent requested. The set of parent specifiers
//    is the "what would the resolver pick without the override" surface.
// 4. Decide:
//      REQUIRED  — at least one parent specifier intersects the vulnerable
//                  range (without the override the resolver may pick a
//                  vulnerable version).
//      STALE     — every parent specifier is disjoint from the vulnerable
//                  range AND the resolved versions live inside the patched
//                  range; OR there is no parent at all (no transitive dep
//                  resolves <name>) so the override is dead weight.
// 5. Allowlist: a stale entry passes if scripts/README.md lists it inside
//    the `overrides-allowlist` markers with a "Why kept" sentence.
// 6. Empty / absent: if `pnpm.overrides` is absent or `{}`, exit 0
//    silently — nothing to validate.
//
// No-network policy: this implementation uses ONLY the local lockfile and
// node_modules/.pnpm tree. If those are missing (i.e. install hasn't run),
// the check fails closed with a `no-network` style diagnostic — it MUST
// NOT silently pass when it cannot perform its analysis.
//
// Spec: openspec/specs/scripts-folder-hygiene/spec.md (rule R-OverridesStale).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MARKER_START = "<!-- overrides-allowlist:start -->";
const MARKER_END = "<!-- overrides-allowlist:end -->";

// ---------------------------------------------------------------------------
// Minimal semver-range engine — covers the grammar pnpm overrides actually use:
//   - bare versions:       "1.2.3", "3.14.2"             → exact match
//   - comparators:         ">=1.2.3", "<4.0.0", "<=2.0", "=1.0.0"
//   - composite (AND):     ">=6.7.0 <=6.14.1"
//   - caret:               "^1.2.3", "^0.2.3", "^0.0.3"
//   - tilde:               "~1.2.3"
//   - wildcard:            "*", "x", ""                  → matches everything
//
// We deliberately do NOT handle:
//   - hyphen ranges      "1.2.3 - 2.0.0"
//   - OR clauses         "1.x || >=2.0"
//   - pre-release tags   "1.0.0-alpha"
// pnpm overrides rarely use those; if encountered we throw, which surfaces
// the gap loudly rather than silently misclassifying.
// ---------------------------------------------------------------------------

function parseSemver(s) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(String(s).trim());
  if (!m) {
    const short = /^(\d+)(?:\.(\d+))?$/.exec(String(s).trim());
    if (short) {
      return [Number(short[1]), Number(short[2] ?? 0), 0];
    }
    throw new Error(`unparseable semver: "${s}"`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i] < 0 ? -1 : 1;
  }
  return 0;
}

function bumpMajor(v) {
  return [v[0] + 1, 0, 0];
}

function bumpMinor(v) {
  return [v[0], v[1] + 1, 0];
}

function bumpPatch(v) {
  return [v[0], v[1], v[2] + 1];
}

// Returns an interval { lo, loIncl, hi, hiIncl } where lo/hi are tuples or
// null. null lo = -infinity, null hi = +infinity.
function comparatorToInterval(token) {
  const t = token.trim();
  if (t === "" || t === "*" || t === "x" || t === "X") {
    return { lo: null, loIncl: false, hi: null, hiIncl: false };
  }
  if (t.startsWith("^")) {
    const v = parseSemver(t.slice(1));
    let upper;
    if (v[0] > 0) upper = bumpMajor(v);
    else if (v[1] > 0) upper = bumpMinor(v);
    else upper = bumpPatch(v);
    return { lo: v, loIncl: true, hi: upper, hiIncl: false };
  }
  if (t.startsWith("~")) {
    const v = parseSemver(t.slice(1));
    return { lo: v, loIncl: true, hi: bumpMinor(v), hiIncl: false };
  }
  if (t.startsWith(">=")) {
    return {
      lo: parseSemver(t.slice(2)),
      loIncl: true,
      hi: null,
      hiIncl: false,
    };
  }
  if (t.startsWith("<=")) {
    return {
      lo: null,
      loIncl: false,
      hi: parseSemver(t.slice(2)),
      hiIncl: true,
    };
  }
  if (t.startsWith(">")) {
    return {
      lo: parseSemver(t.slice(1)),
      loIncl: false,
      hi: null,
      hiIncl: false,
    };
  }
  if (t.startsWith("<")) {
    return {
      lo: null,
      loIncl: false,
      hi: parseSemver(t.slice(1)),
      hiIncl: false,
    };
  }
  if (t.startsWith("=")) {
    const v = parseSemver(t.slice(1));
    return { lo: v, loIncl: true, hi: v, hiIncl: true };
  }
  // Bare version — exact match.
  const v = parseSemver(t);
  return { lo: v, loIncl: true, hi: v, hiIncl: true };
}

// Combine multiple comparators (AND) into a single interval (intersection).
function intersectIntervals(a, b) {
  let lo = a.lo;
  let loIncl = a.loIncl;
  if (b.lo) {
    if (lo === null || compareSemver(b.lo, lo) > 0) {
      lo = b.lo;
      loIncl = b.loIncl;
    } else if (compareSemver(b.lo, lo) === 0) {
      loIncl = loIncl && b.loIncl;
    }
  }
  let hi = a.hi;
  let hiIncl = a.hiIncl;
  if (b.hi) {
    if (hi === null || compareSemver(b.hi, hi) < 0) {
      hi = b.hi;
      hiIncl = b.hiIncl;
    } else if (compareSemver(b.hi, hi) === 0) {
      hiIncl = hiIncl && b.hiIncl;
    }
  }
  return { lo, loIncl, hi, hiIncl };
}

function isEmptyInterval(iv) {
  if (iv.lo === null || iv.hi === null) return false;
  const cmp = compareSemver(iv.lo, iv.hi);
  if (cmp > 0) return true;
  if (cmp === 0 && !(iv.loIncl && iv.hiIncl)) return true;
  return false;
}

function parseRange(range) {
  const r = String(range).trim();
  if (r === "" || r === "*") {
    return { lo: null, loIncl: false, hi: null, hiIncl: false };
  }
  if (r.includes("||")) {
    throw new Error(`OR ranges not supported by R-OverridesStale: "${range}"`);
  }
  if (r.includes(" - ")) {
    throw new Error(
      `Hyphen ranges not supported by R-OverridesStale: "${range}"`
    );
  }
  // Drop leading "v" if present, then split on whitespace.
  const tokens = r
    .replace(/\bv(\d)/g, "$1")
    .split(/\s+/)
    .filter(Boolean);
  let iv = { lo: null, loIncl: false, hi: null, hiIncl: false };
  for (const tok of tokens) {
    const piece = comparatorToInterval(tok);
    iv = intersectIntervals(iv, piece);
    if (isEmptyInterval(iv)) return iv;
  }
  return iv;
}

function rangesIntersect(rangeA, rangeB) {
  const a = parseRange(rangeA);
  const b = parseRange(rangeB);
  const merged = intersectIntervals(a, b);
  return !isEmptyInterval(merged);
}

function versionInRange(version, range) {
  const v = parseSemver(version);
  const iv = parseRange(range);
  if (iv.lo) {
    const c = compareSemver(v, iv.lo);
    if (c < 0) return false;
    if (c === 0 && !iv.loIncl) return false;
  }
  if (iv.hi) {
    const c = compareSemver(v, iv.hi);
    if (c > 0) return false;
    if (c === 0 && !iv.hiIncl) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Override key parsing.
//   "qs@>=6.7.0 <=6.14.1"        => { name: "qs", vuln: ">=6.7.0 <=6.14.1" }
//   "@isaacs/brace-expansion@<5" => { name: "@isaacs/brace-expansion", vuln: "<5" }
//   "lodash"                     => { name: "lodash", vuln: "*" }
//   "vite"                       => { name: "vite", vuln: "*" }
// ---------------------------------------------------------------------------

function parseOverrideKey(key) {
  let name;
  let rest;
  if (key.startsWith("@")) {
    const slash = key.indexOf("/");
    if (slash === -1) {
      // bare scoped name (extremely unusual but possible)
      return { name: key, vuln: "*" };
    }
    const at = key.indexOf("@", slash + 1);
    if (at === -1) {
      return { name: key, vuln: "*" };
    }
    name = key.slice(0, at);
    rest = key.slice(at + 1);
  } else {
    const at = key.indexOf("@");
    if (at === -1) {
      return { name: key, vuln: "*" };
    }
    name = key.slice(0, at);
    rest = key.slice(at + 1);
  }
  return { name, vuln: rest.trim() === "" ? "*" : rest.trim() };
}

// Encode a package name the way pnpm encodes it for `node_modules/.pnpm/<dir>`:
// "@scope/name" => "@scope+name", everything else unchanged.
function encodeScopedName(name) {
  return name.replace("/", "+");
}

// ---------------------------------------------------------------------------
// Lockfile + node_modules/.pnpm scanning.
// ---------------------------------------------------------------------------

function readLockfileSnapshots(lockText) {
  // Returns Map<packageName, Set<resolvedVersion>>.
  // We grep for top-level `^  <name>@<version>:` entries — pnpm's lockfile
  // has two passes (`packages:` and a snapshots-style block lower); both
  // use the same `<name>@<version>:` shape.
  const out = new Map();
  const lineRe =
    /^  ((?:@[^/]+\/)?[a-zA-Z0-9._-]+)@([^:\s(]+)(?:\([^)]+\))?:\s*$/;
  for (const raw of lockText.split("\n")) {
    const m = lineRe.exec(raw);
    if (!m) continue;
    const name = m[1];
    const version = m[2];
    if (!/^\d/.test(version)) continue;
    if (!out.has(name)) out.set(name, new Set());
    out.get(name).add(version);
  }
  return out;
}

function listPnpmEntries(pnpmDir) {
  if (!existsSync(pnpmDir)) return [];
  return readdirSync(pnpmDir).filter((d) => {
    if (d === "node_modules") return false;
    if (d.startsWith(".")) return false;
    try {
      return statSync(join(pnpmDir, d)).isDirectory();
    } catch {
      return false;
    }
  });
}

// Decode a node_modules/.pnpm/<dir> back to its bare `<name>@<version>` head.
//   "express-rate-limit@8.3.2_express@5.2.1" => "express-rate-limit@8.3.2"
//   "@types+node@25.6.0"                     => "@types/node@25.6.0"
//   "vite@8.0.10_@types+node@25.6.0_..."     => "vite@8.0.10"
function decodePnpmEntry(entry) {
  // The first underscore that appears after the leading <name>@<version>
  // segment delimits the head from the peer-dep tail. Underscores are valid
  // in package names but never in this leading position before "@", so we
  // walk from the start, tracking the @ that separates name and version.
  let name;
  let rest;
  if (entry.startsWith("@")) {
    const plus = entry.indexOf("+");
    if (plus === -1) return null;
    const at = entry.indexOf("@", plus + 1);
    if (at === -1) return null;
    name = "@" + entry.slice(1, plus) + "/" + entry.slice(plus + 1, at);
    rest = entry.slice(at + 1);
  } else {
    const at = entry.indexOf("@");
    if (at === -1) return null;
    name = entry.slice(0, at);
    rest = entry.slice(at + 1);
  }
  const underscore = rest.indexOf("_");
  const version = underscore === -1 ? rest : rest.slice(0, underscore);
  return { name, version };
}

// Read every parent specifier for `targetName` from node_modules/.pnpm.
// Returns Array<{ parentName, parentVersion, specifier }>.
function collectParentSpecifiers(pnpmDir, targetName) {
  const out = [];
  for (const entry of listPnpmEntries(pnpmDir)) {
    const parent = decodePnpmEntry(entry);
    if (!parent) continue;
    if (parent.name === targetName) continue; // skip the target's own snapshot
    const pkgPath = join(
      pnpmDir,
      entry,
      "node_modules",
      parent.name,
      "package.json"
    );
    let json;
    try {
      json = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      continue;
    }
    // devDependencies are NOT installed transitively when a package is
    // consumed from the registry, so they don't influence what the resolver
    // picks for downstream consumers — exclude them.
    for (const field of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      const deps = json && json[field];
      if (!deps || typeof deps !== "object") continue;
      const spec = deps[targetName];
      if (typeof spec !== "string") continue;
      out.push({
        parentName: parent.name,
        parentVersion: parent.version,
        specifier: spec,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Allowlist parser — mirrors check-scripts-orphans.mjs's marker pattern.
// ---------------------------------------------------------------------------

function parseAllowlist(readmeText) {
  const startIdx = readmeText.indexOf(MARKER_START);
  const endIdx = readmeText.indexOf(MARKER_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return { missingMarkers: true, entries: new Map(), malformed: [] };
  }
  const block = readmeText.slice(startIdx + MARKER_START.length, endIdx);
  const entries = new Map();
  const malformed = [];
  const lineRe = /^\s*-\s+`([^`]+)`\s+(.+?)\s*$/;
  for (const raw of block.split("\n")) {
    const line = raw.trimEnd();
    if (line.trim() === "") continue;
    const m = lineRe.exec(line);
    if (!m) {
      malformed.push({
        line: line.trim(),
        reason: "not a `\\`<key>\\` — Why kept: <reason>` row",
      });
      continue;
    }
    const key = m[1];
    const rest = m[2];
    if (!/why kept/i.test(rest)) {
      malformed.push({
        line: line.trim(),
        reason: 'missing "Why kept" annotation',
      });
      continue;
    }
    entries.set(key, rest);
  }
  return { missingMarkers: false, entries, malformed };
}

// ---------------------------------------------------------------------------
// Main check.
// ---------------------------------------------------------------------------

export function checkOverridesStale({ rootDir } = {}) {
  const repoRoot = rootDir ?? resolve(__dirname, "..");
  const pkgPath = join(repoRoot, "package.json");
  const lockPath = join(repoRoot, "pnpm-lock.yaml");
  const readmePath = join(repoRoot, "scripts", "README.md");
  const pnpmDir = join(repoRoot, "node_modules", ".pnpm");

  if (!existsSync(pkgPath)) {
    return {
      diagnostics: [`${pkgPath}: missing root package.json (R-OverridesStale)`],
      stale: [],
      allowlistErrors: [],
      summary: { total: 0, required: 0, stale: 0, allowlisted: 0 },
    };
  }

  const pkgJson = JSON.parse(readFileSync(pkgPath, "utf8"));
  const overrides = pkgJson?.pnpm?.overrides;
  if (!overrides || Object.keys(overrides).length === 0) {
    return {
      diagnostics: [],
      stale: [],
      allowlistErrors: [],
      summary: { total: 0, required: 0, stale: 0, allowlisted: 0 },
      empty: true,
    };
  }

  // No-network fail-closed: if the install tree isn't on disk, we can't
  // re-resolve transitive specifiers, so we fail with a clear message
  // rather than silently passing.
  if (!existsSync(lockPath)) {
    return {
      diagnostics: [
        `pnpm-lock.yaml missing — cannot run R-OverridesStale offline (no-network fail-closed)`,
      ],
      stale: [],
      allowlistErrors: [],
      summary: { total: 0, required: 0, stale: 0, allowlisted: 0 },
    };
  }
  if (!existsSync(pnpmDir)) {
    return {
      diagnostics: [
        `node_modules/.pnpm missing — run \`pnpm install --frozen-lockfile\` before R-OverridesStale (no-network fail-closed)`,
      ],
      stale: [],
      allowlistErrors: [],
      summary: { total: 0, required: 0, stale: 0, allowlisted: 0 },
    };
  }

  const lockSnapshots = readLockfileSnapshots(readFileSync(lockPath, "utf8"));
  const readmeText = existsSync(readmePath)
    ? readFileSync(readmePath, "utf8")
    : "";
  const allow = parseAllowlist(readmeText);

  const diagnostics = [];
  const stale = [];
  const allowlistErrors = [];
  let requiredCount = 0;
  let allowlistedCount = 0;
  const claimedAllowlist = new Set();

  if (allow.missingMarkers) {
    allowlistErrors.push(
      `scripts/README.md is missing required \`${MARKER_START}\` / \`${MARKER_END}\` markers (R-OverridesStale)`
    );
  }
  for (const m of allow.malformed) {
    allowlistErrors.push(
      `scripts/README.md overrides-allowlist row malformed (R-OverridesStale): ${m.reason} — line: ${m.line}`
    );
  }

  for (const [key, patched] of Object.entries(overrides)) {
    let parsed;
    try {
      parsed = parseOverrideKey(key);
    } catch (err) {
      diagnostics.push(`override "${key}": parse error — ${err.message}`);
      continue;
    }
    const { name, vuln } = parsed;
    const decision = decideOverrideStatus({
      name,
      vuln,
      patched,
      lockSnapshots,
      pnpmDir,
    });
    if (decision.required) {
      requiredCount++;
      continue;
    }
    if (allow.entries.has(key)) {
      allowlistedCount++;
      claimedAllowlist.add(key);
      continue;
    }
    stale.push({ key, name, vuln, patched, reason: decision.reason });
  }

  // An allowlist entry that points to an override which is no longer stale
  // (or no longer exists) is also a violation — keeps the allowlist tight.
  for (const claim of allow.entries.keys()) {
    if (!Object.prototype.hasOwnProperty.call(overrides, claim)) {
      allowlistErrors.push(
        `scripts/README.md overrides-allowlist entry \`${claim}\` does not match any current override key (R-OverridesStale)`
      );
    } else if (!claimedAllowlist.has(claim)) {
      allowlistErrors.push(
        `scripts/README.md overrides-allowlist entry \`${claim}\` is not stale anymore — remove it (R-OverridesStale)`
      );
    }
  }

  return {
    diagnostics,
    stale,
    allowlistErrors,
    summary: {
      total: Object.keys(overrides).length,
      required: requiredCount,
      stale: stale.length,
      allowlisted: allowlistedCount,
    },
  };
}

function decideOverrideStatus({ name, vuln, patched, lockSnapshots, pnpmDir }) {
  const parents = collectParentSpecifiers(pnpmDir, name);
  if (parents.length === 0) {
    const installed = lockSnapshots.get(name);
    if (!installed || installed.size === 0) {
      return {
        required: false,
        reason: `no transitive dep on ${name} — override is dead weight`,
      };
    }
    // Installed at root level (workspace direct dep) but no transitive
    // parents — treat as STALE because the override is only meant to
    // re-pin transitive resolutions.
    return {
      required: false,
      reason: `${name} is only directly depended on; no transitive parent specifiers to evaluate against the override`,
    };
  }
  // Required iff any parent specifier intersects vuln range.
  for (const p of parents) {
    let intersects;
    try {
      intersects = rangesIntersect(p.specifier, vuln);
    } catch (err) {
      // Specifier we can't parse — treat conservatively as REQUIRED so we
      // never falsely claim "stale" on an entry whose grammar exceeds our
      // semver mini-engine.
      return {
        required: true,
        reason: `parent ${p.parentName}@${p.parentVersion} requests ${name}@${p.specifier} — unparseable, treated as required: ${err.message}`,
      };
    }
    if (intersects) {
      return {
        required: true,
        reason: `parent ${p.parentName}@${p.parentVersion} requests ${name}@${p.specifier} which intersects vuln range ${vuln}`,
      };
    }
  }
  return {
    required: false,
    reason:
      `every parent specifier disjoint from vuln range ${vuln} ` +
      `(${parents.length} parent${parents.length === 1 ? "" : "s"} examined)`,
  };
}

function formatSummary(result) {
  const { summary } = result;
  return `pnpm.overrides audit: ${summary.total} total — ${summary.required} required, ${summary.allowlisted} allowlisted, ${summary.stale} stale`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkOverridesStale();

  if (result.empty) {
    process.exit(0);
  }

  if (result.diagnostics.length > 0) {
    for (const d of result.diagnostics) console.error(`R-OverridesStale: ${d}`);
    process.exit(1);
  }

  let failed = false;

  if (result.allowlistErrors.length > 0) {
    failed = true;
    console.error("\nR-OverridesStale allowlist errors:\n");
    for (const e of result.allowlistErrors) console.error(`  ${e}`);
  }

  if (result.stale.length > 0) {
    failed = true;
    console.error(
      `\nR-OverridesStale: ${result.stale.length} stale override(s):\n`
    );
    for (const s of result.stale) {
      console.error(`  "${s.key}": "${s.patched}" — ${s.reason}`);
    }
    console.error(
      `\nFix: either drop the override from package.json#pnpm.overrides ` +
        `OR add an allowlist row in scripts/README.md between\n` +
        `  ${MARKER_START} and ${MARKER_END}\n` +
        `formatted as: - \`<override-key>\` — Why kept: <reason>\n`
    );
  }

  if (failed) {
    console.error(`\n${formatSummary(result)}`);
    process.exit(1);
  }

  console.log(formatSummary(result));
}
