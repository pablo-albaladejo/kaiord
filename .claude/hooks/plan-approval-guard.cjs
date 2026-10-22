#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit|NotebookEdit): no code write into this
// repository without a human-approval receipt for the session
// (R-PlanApprovalReceipt, spec/agent-guardrails).
//
// The receipt is written by record-human-approval.cjs when Pablo types a
// prompt. Subagents inherit it: measured on Claude Code 2.1.304, a tool call
// inside a subagent (foreground or background) carries the PARENT's
// session_id, plus its own agent_id. An agent-team teammate is different:
// it is its own process with its OWN session_id and no agent_id, and its
// argv carries `--parent-session-id <lead>`. Its writes are judged by the
// lead's receipt, found by walking this hook's process ancestry.
//
// Always allowed, receipt or not: paths outside every worktree of this
// repository (the system temp dirs, the session scratchpad, other repos),
// `.omc/**`, and `.claude/**` state. The guard's own wiring is NOT state: `.claude/settings*`
// and `.claude/hooks/**` need a receipt like any code.
//
// LIMIT: the receipt is a local file. Anything that can write to
// $TMPDIR/claude-guards/approvals/ can forge one, and a Bash command that
// writes a file (`sed -i`, `>`) is not an Edit and is not seen here. This
// stops an agent drifting into code without a human turn; it is not a
// security boundary.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { TTL_MS, receiptPath } = require("./record-human-approval.cjs");
const {
  appendLog,
  git,
  parseInput,
  readJson,
  readStdin,
  safeSessionId,
} = require("./guard-common.cjs");

const BLOCK_MESSAGE =
  "no human approval in this session: ask Pablo, or wait for his message";

const WRITE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

function receiptIsValid(receipt, sessionId, now) {
  if (!receipt || receipt.session_id !== sessionId) return false;
  const recorded = Date.parse(receipt.recorded_at);
  const expires = Date.parse(receipt.expires_at);
  if (!Number.isFinite(recorded) || !Number.isFinite(expires)) return false;
  return (
    recorded <= now + 60_000 && expires > now && expires - recorded <= TTL_MS
  );
}

// The lead's session_id when this hook runs under an agent-team teammate:
// the nearest ancestor whose argv has `--parent-session-id <id>`.
function parentSessionFromAncestry(startPid = process.ppid) {
  let pid = startPid;
  for (let hops = 0; pid > 1 && hops < 12; hops++) {
    let line;
    try {
      line = execFileSync("ps", ["-o", "ppid=,args=", "-p", String(pid)], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return null;
    }
    const m = /^(\d+)\s+(.*)$/s.exec(line);
    if (!m) return null;
    const found = /--parent-session-id[= ](\S+)/.exec(m[2]);
    if (found) return safeSessionId(found[1]);
    pid = Number(m[1]);
  }
  return null;
}

// Resolve `file` through its nearest existing ancestor (so /tmp becomes
// /private/tmp on macOS) and keep the not-yet-created tail. Returns the
// ancestor directory and the resolved full path.
function resolveTarget(file) {
  const abs = path.resolve(file);
  let dir = path.dirname(abs);
  while (!fs.existsSync(dir)) {
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  if (dir === path.dirname(abs) && fs.existsSync(abs)) {
    // An existing file (or symlink) is judged where it really lives.
    const target = fs.realpathSync(abs);
    return { dir: path.dirname(target), target };
  }
  const real = fs.realpathSync(dir);
  return { dir: real, target: path.join(real, path.relative(dir, abs)) };
}

function repoOf(dir) {
  try {
    const out = git(dir, [
      "rev-parse",
      "--path-format=absolute",
      "--git-common-dir",
      "--show-toplevel",
    ])
      .trim()
      .split("\n");
    return { commonDir: fs.realpathSync(out[0]), top: fs.realpathSync(out[1]) };
  } catch {
    return null;
  }
}

function isTracked(rel, root) {
  if (!root) return true; // unknown: treat as code
  try {
    return git(root, ["ls-files", "--", rel]).trim().length > 0;
  } catch {
    return true;
  }
}

// Inside the repo, which repo-relative paths need no receipt.
function isExemptRepoPath(rel, root) {
  // Lowercased: APFS is case-insensitive, so `.claude/SETTINGS.json` IS
  // the settings file.
  const p = rel.split(path.sep).join("/").toLowerCase();
  if (p.startsWith(".omc/")) return true;
  if (!p.startsWith(".claude/")) return false;
  if (/^\.claude\/settings(\.local)?\.json$/.test(p)) return false;
  // Tracked files under .claude/ are committed executable configuration
  // (hooks, agents, skills, plugins): they need a receipt. Only untracked
  // state (scheduled_tasks.json, worktrees, ...) is exempt.
  if (
    /^\.claude\/(hooks|agents|skills|plugins|commands|output-styles)\//.test(p)
  )
    return false; // a NEW file there is executable configuration too
  return !isTracked(rel, root);
}

// "allow" or "deny", with the reason for the log.
function decide(
  input,
  {
    env = process.env,
    now = Date.now(),
    parentSession = parentSessionFromAncestry,
  } = {}
) {
  if (!WRITE_TOOLS.has(input.tool_name))
    return { verdict: "allow", why: "not a write tool" };
  const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (typeof file !== "string" || file.length === 0)
    return { verdict: "allow", why: "no path" };

  const resolved = resolveTarget(file);
  if (!resolved) return { verdict: "allow", why: "no existing ancestor" };
  const { dir, target } = resolved;

  // Temp dirs, the scratchpad and other repositories are allowed because
  // they are not this repository: the check is membership, not a path list.
  const projectRepo = repoOf(
    env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  );
  if (!projectRepo) return { verdict: "allow", why: "outside the repository" };
  // The git dir itself (.git/hooks, .git/config) has no work tree, so
  // rev-parse cannot place it: it is repository territory all the same.
  const inGitDir = target.startsWith(projectRepo.commonDir + path.sep);
  const fileRepo = inGitDir ? null : repoOf(dir);
  if (!inGitDir && (!fileRepo || fileRepo.commonDir !== projectRepo.commonDir))
    return { verdict: "allow", why: "outside the repository" };

  const rel = inGitDir
    ? path.join(".git", path.relative(projectRepo.commonDir, target))
    : path.relative(fileRepo.top, target);
  if (!inGitDir && isExemptRepoPath(rel, fileRepo.top))
    return { verdict: "allow", why: `exempt ${rel}` };

  const sessionId = safeSessionId(input.session_id);
  const receipt = sessionId ? readJson(receiptPath(env, sessionId)) : null;
  if (sessionId && receiptIsValid(receipt, sessionId, now))
    return { verdict: "allow", why: `receipt ${receipt.recorded_at}` };
  const lead = parentSession();
  if (lead && lead !== sessionId) {
    const leadReceipt = readJson(receiptPath(env, lead));
    if (receiptIsValid(leadReceipt, lead, now))
      return { verdict: "allow", why: `lead receipt ${lead}` };
  }
  return { verdict: "deny", why: `no valid receipt for ${rel}` };
}

module.exports = {
  BLOCK_MESSAGE,
  decide,
  isExemptRepoPath,
  parentSessionFromAncestry,
  receiptIsValid,
};

if (require.main === module) {
  const input = parseInput(readStdin());
  if (!input) {
    console.error(
      `plan-approval-guard: unreadable hook input (fail closed). ${BLOCK_MESSAGE}`
    );
    process.exit(2);
  }
  let verdict;
  let why;
  try {
    ({ verdict, why } = decide(input));
  } catch (err) {
    console.error(
      `plan-approval-guard: crashed (${err?.message}; fail closed). ${BLOCK_MESSAGE}`
    );
    process.exit(2);
  }
  if (verdict === "deny") {
    appendLog(
      process.env,
      `plan-approval-guard deny session=${input.session_id} agent=${input.agent_id ?? "-"} ${why}`
    );
    process.stdout.write(
      `${JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: BLOCK_MESSAGE,
        },
      })}\n`
    );
  }
  process.exit(0);
}
