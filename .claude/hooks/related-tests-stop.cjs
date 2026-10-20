#!/usr/bin/env node
// Stop / SubagentStop: a turn does not close with red tests related to the
// files it changed (R-RelatedTestsStop, spec/agent-guardrails).
//
// 1. Changed files of the worktree at the hook input's `cwd`:
//    `git diff --name-only HEAD` plus untracked, non-ignored files.
// 2. Nothing test-relevant -> exit 0 at once. Otherwise plan the related runs:
//      packages/<pkg>/**  (with a vitest config)  vitest related --run <files>
//      scripts/**, packages/<pkg>/scripts/**, .claude/hooks/**
//                                                 node --test <co-located *.test.mjs>
// 3. Run them under ~/.claude/hostguard/hg-gate.sh with a 180 s budget.
//      green                 -> allow; remember the tree fingerprint so an
//                               unchanged tree is not re-run on the next Stop
//      red                   -> block, failing test names in the reason
//      timeout / exit 75 /   -> allow with a visible warning, logged to
//      runner unavailable       $TMPDIR/claude-guards/guards.log
// 4. No `stop_hook_active` skip-all: a second Stop is checked like the first
//    (skipping it is how Bushido's quality-gate.sh let red turns close).
//    Instead, consecutive blocks are capped at 3 per session in a hook-owned
//    file OUTSIDE the repo ($TMPDIR/claude-guards/<session_id>.json, one slot
//    per agent); the fourth red Stop is let through with a loud message and
//    the count resets.
const { spawn, spawnSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  appendLog,
  git,
  gitEnv,
  guardDir,
  parseInput,
  readJson,
  readStdin,
  safeSessionId,
  writeJson,
} = require("./guard-common.cjs");

const MAX_CONSECUTIVE_BLOCKS = 3;
const DEFAULT_BUDGET_MS = 180_000;
const CODE = /\.(c|m)?[jt]sx?$/;
const GENERATED = /(^|\/)(node_modules|dist|coverage|build|\.turbo)\//;
const NODE_TEST_DIR =
  /^(scripts\/|\.claude\/hooks\/|packages\/[^/]+\/scripts\/)/;
const VITEST_CONFIG = /^vitest\.config\.(ts|mts|js|mjs|cjs)$/;
const INFRA =
  /Command "vitest" not found|ERR_PNPM|Cannot find module ['"]vitest|spawn \S+ ENOENT|ENOENT: no such file or directory, open '.*node_modules/;

// ------------------------------------------------------------------ planning

function changedFiles(root) {
  const lines = (args) => git(root, args).split("\n").filter(Boolean);
  return [
    ...new Set([
      ...lines(["diff", "--name-only", "HEAD"]),
      ...lines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
}

const hasVitestConfig = (root, pkg) => {
  try {
    return fs
      .readdirSync(path.join(root, pkg))
      .some((f) => VITEST_CONFIG.test(f));
  } catch {
    return false;
  }
};

// Pure apart from existence checks, which the tests inject.
function planRuns(files, { exists, isVitestPackage }) {
  const vitest = new Map();
  const nodeTests = new Set();
  for (const file of files) {
    if (!CODE.test(file) || GENERATED.test(file) || !exists(file)) continue;
    if (NODE_TEST_DIR.test(file)) {
      const test = /\.test\.mjs$/.test(file)
        ? file
        : file.replace(/\.(c|m)?[jt]sx?$/, ".test.mjs");
      if (exists(test)) nodeTests.add(test);
      continue;
    }
    const match = /^(packages\/[^/]+)\/(.+)$/.exec(file);
    if (!match || !isVitestPackage(match[1])) continue;
    if (!vitest.has(match[1])) vitest.set(match[1], []);
    vitest.get(match[1]).push(match[2]);
  }
  const lanes = [...vitest.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pkg, list]) => ({ kind: "vitest", pkg, files: list.sort() }));
  if (nodeTests.size > 0)
    lanes.push({ kind: "node", files: [...nodeTests].sort() });
  return lanes;
}

const laneLabel = (lane) =>
  lane.kind === "vitest"
    ? `(cd ${lane.pkg} && pnpm exec vitest related --run ${lane.files.join(" ")})`
    : `node --test ${lane.files.join(" ")}`;

// Same tree, same plan -> same fingerprint. Untracked files are hashed by
// content because `git diff` cannot see them.
function fingerprint(root, lanes) {
  const hash = crypto.createHash("sha256");
  hash.update(git(root, ["rev-parse", "HEAD"]));
  hash.update(git(root, ["diff", "HEAD"]));
  for (const file of git(root, ["ls-files", "--others", "--exclude-standard"])
    .split("\n")
    .filter(Boolean)) {
    hash.update(file);
    try {
      hash.update(fs.readFileSync(path.join(root, file)));
    } catch {
      hash.update("<unreadable>");
    }
  }
  hash.update(JSON.stringify(lanes));
  return hash.digest("hex");
}

// ------------------------------------------------------------------- parsing

function vitestFailures(report, pkgDir) {
  const failures = [];
  for (const suite of report?.testResults ?? []) {
    const file = path.relative(pkgDir, suite.name ?? "") || suite.name;
    const failed = (suite.assertionResults ?? []).filter(
      (a) => a.status === "failed"
    );
    for (const a of failed) failures.push(`${file} > ${a.fullName ?? a.title}`);
    if (failed.length === 0 && suite.status === "failed")
      failures.push(
        `${file}: ${String(suite.message ?? "suite failed").split("\n")[0]}`
      );
  }
  return failures;
}

function tapFailures(tap) {
  return tap
    .split("\n")
    .map((line) =>
      /^(\s*)not ok \d+ - (.*?)(\s+#\s*(SKIP|TODO).*)?$/i.exec(line)
    )
    .filter((m) => m && !m[3])
    .map((m) => `${m[1].length > 0 ? "  " : ""}${m[2]}`);
}

const tail = (text, lines = 15) =>
  String(text).trim().split("\n").slice(-lines).join("\n");

// ----------------------------------------------------------------- execution

// Environment for every runner: no inherited GIT_* (a git hook's GIT_DIR) and
// no NODE_TEST_CONTEXT, which makes a nested `node --test` report to the
// enclosing runner instead of exiting non-zero on failure.
const runnerEnv = (env = process.env) => {
  const clean = gitEnv(env);
  delete clean.NODE_TEST_CONTEXT;
  return clean;
};

// Child mode: run every lane, write a result file. Runs under hg-gate.
function executeLanes(root, lanes, resultFile) {
  const results = [];
  for (const lane of lanes) {
    if (lane.kind === "vitest") {
      const pkgDir = path.join(root, lane.pkg);
      const out = path.join(
        os.tmpdir(),
        `related-tests-${process.pid}-${results.length}.json`
      );
      const run = spawnSync(
        "pnpm",
        [
          "exec",
          "vitest",
          "related",
          "--run",
          "--passWithNoTests",
          "--reporter=json",
          `--outputFile=${out}`,
          ...lane.files,
        ],
        {
          cwd: pkgDir,
          encoding: "utf8",
          env: { ...runnerEnv(), CI: "1" },
          maxBuffer: 64 * 1024 * 1024,
        }
      );
      const report = readJson(out);
      fs.rmSync(out, { force: true });
      const text = `${run.stdout ?? ""}\n${run.stderr ?? ""}\n${run.error?.message ?? ""}`;
      const status = run.status ?? 1;
      let failures = report ? vitestFailures(report, pkgDir) : [];
      const infra = status !== 0 && !report && INFRA.test(text);
      if (status !== 0 && failures.length === 0 && !infra)
        failures = [`${lane.pkg}: vitest exited ${status}\n${tail(text)}`];
      results.push({
        lane,
        status,
        failures,
        infra,
        tail: infra ? tail(text, 5) : undefined,
      });
    } else {
      const run = spawnSync(
        process.execPath,
        ["--test", "--test-reporter=tap", ...lane.files],
        {
          cwd: root,
          encoding: "utf8",
          env: runnerEnv(),
          maxBuffer: 64 * 1024 * 1024,
        }
      );
      const status = run.status ?? 1;
      let failures = status === 0 ? [] : tapFailures(run.stdout ?? "");
      if (status !== 0 && failures.length === 0)
        failures = [
          `node --test exited ${status}\n${tail(`${run.stdout}\n${run.stderr}`)}`,
        ];
      results.push({ lane, status, failures, infra: false });
    }
  }
  writeJson(resultFile, { results });
  return results.some((r) => r.status !== 0 && !r.infra) ? 1 : 0;
}

function hgGatePath(env) {
  if (env.CLAUDE_GUARDS_HG_GATE === "none") return null;
  const candidate =
    env.CLAUDE_GUARDS_HG_GATE ||
    path.join(env.HOME || os.homedir(), ".claude/hostguard/hg-gate.sh");
  return fs.existsSync(candidate) ? candidate : null;
}

// Parent mode: run the child (under hg-gate when present) with a hard budget.
function runWithBudget(root, lanes, { env, budgetMs }) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "related-tests-"));
  const planFile = path.join(work, "plan.json");
  const resultFile = path.join(work, "result.json");
  fs.writeFileSync(planFile, JSON.stringify(lanes));
  const child = [
    process.execPath,
    __filename,
    "--execute",
    root,
    planFile,
    resultFile,
  ];
  const gate = hgGatePath(env);
  const [cmd, ...args] = gate
    ? [
        "bash",
        gate,
        "--label",
        `related-tests:${path.basename(root)}`,
        "--",
        ...child,
      ]
    : child;

  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd: root,
      detached: true,
      stdio: ["ignore", "ignore", "pipe"],
      env: {
        ...runnerEnv(env),
        HG_LOCK_WAIT_SECS: String(Math.max(10, Math.floor(budgetMs / 3000))),
      },
    });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));
    const signalGroup = (sig) => {
      try {
        process.kill(-proc.pid, sig);
      } catch {
        // the group is already gone
      }
    };
    let timedOut = false;
    let done = false;
    let hardStop;
    const timer = setTimeout(() => {
      timedOut = true;
      signalGroup("SIGTERM");
      // Something that ignores TERM must not hold the Stop open.
      hardStop = setTimeout(() => {
        signalGroup("SIGKILL");
        finish(null);
      }, KILL_GRACE_MS);
    }, budgetMs);
    const finish = (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(hardStop);
      // hg-gate may abort only its direct child; reap vitest stragglers.
      signalGroup("SIGKILL");
      const result = readJson(resultFile);
      fs.rmSync(work, { recursive: true, force: true });
      if (timedOut) return resolve({ outcome: "timeout" });
      if (code === 75)
        return resolve({ outcome: "host", detail: tail(stderr, 4) });
      if (!result)
        return resolve({
          outcome: "infra",
          detail: tail(stderr, 6) || `runner exited ${code}`,
        });
      const red = result.results.filter((r) => r.status !== 0 && !r.infra);
      const infra = result.results.filter((r) => r.infra);
      if (red.length > 0) return resolve({ outcome: "red", red });
      if (infra.length > 0)
        return resolve({
          outcome: "infra",
          detail: infra.map((r) => `${r.lane.pkg}: ${r.tail}`).join("\n"),
        });
      return resolve({ outcome: "green" });
    };
    proc.on("error", () => finish(null));
    proc.on("close", finish);
  });
}

const KILL_GRACE_MS = 10_000;

// ------------------------------------------------------------------ verdicts

const statePath = (env, sessionId) =>
  path.join(guardDir(env), `${sessionId}.json`);

// Session state, shared format with the Deepgent guard:
//   { "<agent_id | main>": { "blocks": n, "lastGreen": "<toplevel>:<sha256>" } }
// One slot per agent, so a subagent's red runs do not spend the main
// conversation's block budget.
const slotKey = (input) =>
  safeSessionId(input?.agent_id) ? input.agent_id : "main";

// Pure: given the agent's previous slot and a run outcome, return the hook
// output (null = allow silently) and the next slot.
function verdict(slot, run, { root, fp, lanes }) {
  const next = {
    blocks: slot?.blocks ?? 0,
    lastGreen: slot?.lastGreen ?? null,
  };
  const rerun = lanes.map(laneLabel).join("\n  ");

  if (run.outcome === "green") {
    next.blocks = 0;
    next.lastGreen = `${root}:${fp}`;
    return { output: null, next };
  }
  if (run.outcome !== "red") {
    const why = {
      timeout: "the related tests exceeded the 180 s budget",
      host: "hostguard refused or aborted the run (exit 75: host pressure, not a red)",
      infra: "the test runner could not start",
    }[run.outcome];
    return {
      output: {
        systemMessage: `related-tests Stop hook: NOT VERIFIED, ${why}. The turn may close, but run these before claiming green:\n  ${rerun}${run.detail ? `\n${run.detail}` : ""}`,
      },
      next,
    };
  }

  const failures = run.red.flatMap((r) => r.failures);
  const shown = failures
    .slice(0, 20)
    .map((f) => `  - ${f}`)
    .join("\n");
  const more =
    failures.length > 20 ? `\n  … and ${failures.length - 20} more` : "";
  if (next.blocks >= MAX_CONSECUTIVE_BLOCKS) {
    next.blocks = 0;
    return {
      output: {
        systemMessage: `⚠️  related-tests Stop hook: tests are STILL RED after ${MAX_CONSECUTIVE_BLOCKS} consecutive blocks. Letting this turn close so the session is not stuck — the work is NOT green. Failing:\n${shown}${more}`,
      },
      next,
    };
  }
  next.blocks += 1;
  return {
    output: {
      decision: "block",
      reason: `Related tests are RED for the files changed in ${root} (block ${next.blocks}/${MAX_CONSECUTIVE_BLOCKS}). Fix them before ending the turn:\n${shown}${more}\nRe-run:\n  ${rerun}`,
    },
    next,
  };
}

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

// False only when the subagent's transcript is readable and shows no write
// tool call. Unknown means it may have written: run the tests.
function subagentWrote(input) {
  const file = input?.agent_transcript_path;
  if (typeof file !== "string") return true;
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return true;
  }
  for (const line of text.split("\n")) {
    if (!line.includes('"tool_use"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const content = entry?.message?.content;
    if (
      Array.isArray(content) &&
      content.some((c) => c?.type === "tool_use" && WRITE_TOOLS.has(c.name))
    )
      return true;
  }
  return false;
}

async function main(input, { env = process.env, budgetMs } = {}) {
  const sessionId = safeSessionId(input?.session_id);
  let root;
  try {
    root = git(input?.cwd || process.cwd(), [
      "rev-parse",
      "--show-toplevel",
    ]).trim();
  } catch {
    return null; // not in a git worktree: nothing to check
  }
  const lanes = planRuns(changedFiles(root), {
    exists: (rel) => fs.existsSync(path.join(root, rel)),
    isVitestPackage: (pkg) => hasVitestConfig(root, pkg),
  });
  if (lanes.length === 0) return null;
  // A read-only subagent (Explore, a reviewer) cannot fix the tests: do not
  // block it, and do not spend 180 s re-running them for it.
  if (input?.hook_event_name === "SubagentStop" && !subagentWrote(input))
    return null;

  const file = sessionId ? statePath(env, sessionId) : null;
  const key = slotKey(input);
  const slot = file ? readJson(file)?.[key] : undefined;
  const fp = fingerprint(root, lanes);
  if (slot?.lastGreen === `${root}:${fp}`) return null;

  const run = await runWithBudget(root, lanes, {
    env,
    budgetMs:
      budgetMs ??
      (Number(env.CLAUDE_GUARDS_TEST_BUDGET_MS) || DEFAULT_BUDGET_MS),
  });
  const { output, next } = verdict(slot, run, { root, fp, lanes });
  // Re-read just before writing: another agent of the session may have
  // updated its own slot while the tests ran.
  if (file) writeJson(file, { ...(readJson(file) ?? {}), [key]: next });
  if (run.outcome !== "green")
    appendLog(
      env,
      `related-tests-stop ${run.outcome} session=${sessionId} event=${input?.hook_event_name} agent=${key} root=${root} blocks=${next.blocks}`
    );
  return output;
}

module.exports = {
  MAX_CONSECUTIVE_BLOCKS,
  main,
  planRuns,
  subagentWrote,
  tapFailures,
  verdict,
  vitestFailures,
};

if (require.main === module) {
  if (process.argv[2] === "--execute") {
    const [, , , root, planFile, resultFile] = process.argv;
    process.exit(
      executeLanes(
        root,
        JSON.parse(fs.readFileSync(planFile, "utf8")),
        resultFile
      )
    );
  }
  main(parseInput(readStdin()))
    .then((output) => {
      if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
      process.exit(0);
    })
    .catch((error) => {
      // A crashed gate must not trap the session, and must not pass silently.
      appendLog(process.env, `related-tests-stop error ${error.stack}`);
      process.stdout.write(
        `${JSON.stringify({ systemMessage: `related-tests Stop hook crashed (${error.message}); tests NOT verified.` })}\n`
      );
      process.exit(0);
    });
}
