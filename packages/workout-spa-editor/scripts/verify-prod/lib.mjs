export const DEFAULT_BASE = "https://kaiord.com/app";

export function parseArgs(argv) {
  const out = { base: DEFAULT_BASE, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s);
    if (!["--base", "--only"].includes(flag)) {
      throw new Error(`Unknown argument: ${argv[i]}`);
    }
    const value = inline ?? argv[++i];
    if (!value) throw new Error(`${flag} needs a value`);
    if (flag === "--base") out.base = value.replace(/\/+$/, "");
    else
      out.only = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  }
  return out;
}

export function selectChecks(names, only) {
  if (only.length === 0) return names;
  const unknown = only.filter((n) => !names.includes(n));
  if (unknown.length > 0) {
    throw new Error(`Unknown check(s): ${unknown.join(", ")}`);
  }
  return names.filter((n) => only.includes(n));
}

export function createRecorder(name) {
  const result = { name, passed: [], failed: [], notes: [] };
  return {
    result,
    assert(cond, msg, observed) {
      if (cond) result.passed.push(msg);
      else if (observed === undefined) result.failed.push(msg);
      else result.failed.push(`${msg} | observed: ${oneLine(observed)}`);
      return Boolean(cond);
    },
    note(msg) {
      result.notes.push(msg);
    },
    fail(msg) {
      result.failed.push(msg);
    },
  };
}

export function formatSummary(results, { sha, base }) {
  const lines = [`verify:prod  base=${base}  sha=${sha}`];
  for (const r of results) {
    const ok = r.failed.length === 0 && r.passed.length > 0;
    lines.push(`${ok ? "PASS" : "FAIL"}  ${r.name}`);
    if (r.failed.length === 0 && r.passed.length === 0) {
      lines.push("    x no assertion ran");
    }
    for (const f of r.failed) lines.push(`    x ${f}`);
    for (const p of r.passed) lines.push(`    ok ${p}`);
    for (const n of r.notes) lines.push(`    - ${n}`);
  }
  const failing = results.filter(
    (r) => r.failed.length > 0 || r.passed.length === 0
  );
  lines.push(
    `${results.length - failing.length}/${results.length} passed  sha=${sha}`
  );
  return { text: lines.join("\n"), exitCode: failing.length > 0 ? 1 : 0 };
}

export function oneLine(value, max = 300) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

export async function readDeployedSha(base, fetchImpl = fetch, now = Date.now) {
  try {
    const res = await fetchImpl(`${base}/version.json?ts=${now()}`);
    if (!res.ok) return "unknown";
    const body = await res.json();
    return typeof body?.sha === "string" && body.sha ? body.sha : "unknown";
  } catch {
    return "unknown";
  }
}
