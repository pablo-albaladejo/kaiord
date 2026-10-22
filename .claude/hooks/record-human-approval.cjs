#!/usr/bin/env node
// UserPromptSubmit: record a human-approval receipt for this session
// (R-PlanApprovalReceipt, spec/agent-guardrails).
//
// UserPromptSubmit does NOT fire only for prompts a person types. Measured on
// Claude Code 2.1.304, its `prompt` is also:
//   - "<task-notification>\n<task-id>..."   a background agent reporting back
//   - "<cross-session-message from=...>"    a message from another session
// and the hooks docs add /loop firings to that list. None of those is Pablo,
// so none of them may approve code writes. A teammate message
// ("<teammate-message ...>") is excluded on the same grounds.
//
// KNOWN GAP: a /loop firing replays its prompt text with no marker, so it
// reads as human. Commands Pablo runs with `!` fire no UserPromptSubmit at
// all (measured), so they neither grant nor need a receipt.
//
// Receipt: $TMPDIR/claude-guards/approvals/<session_id>.json, valid 12 h.
// The format is shared with the Deepgent repo's guard.
//
// This hook never blocks a prompt and never prints to stdout: on this event
// stdout is injected into the model's context.
const path = require("path");
const {
  appendLog,
  guardDir,
  parseInput,
  readStdin,
  safeSessionId,
  writeJson,
} = require("./guard-common.cjs");

const TTL_MS = 12 * 60 * 60 * 1000;

// Prompts that Claude Code synthesizes rather than a person typing them.
const MACHINE_PREFIXES = [
  "<task-notification",
  "<cross-session-message",
  "<teammate-message",
  "<system-reminder",
];

function isHumanPrompt(prompt) {
  if (typeof prompt !== "string") return false;
  const text = prompt.trimStart();
  if (text.length === 0) return false;
  return !MACHINE_PREFIXES.some((prefix) => text.startsWith(prefix));
}

const receiptPath = (env, sessionId) =>
  path.join(guardDir(env), "approvals", `${sessionId}.json`);

function buildReceipt(sessionId, now) {
  return {
    session_id: sessionId,
    recorded_at: new Date(now).toISOString(),
    expires_at: new Date(now + TTL_MS).toISOString(),
    source: "UserPromptSubmit",
  };
}

// Returns what happened, for the tests and the log.
function record(input, { env = process.env, now = Date.now() } = {}) {
  const sessionId = safeSessionId(input?.session_id);
  if (!sessionId) return "no-session";
  if (!isHumanPrompt(input.prompt)) return "not-human";
  writeJson(receiptPath(env, sessionId), buildReceipt(sessionId, now));
  return "recorded";
}

module.exports = {
  MACHINE_PREFIXES,
  TTL_MS,
  buildReceipt,
  isHumanPrompt,
  receiptPath,
  record,
};

if (require.main === module) {
  try {
    const input = parseInput(readStdin());
    const outcome = record(input);
    if (outcome !== "recorded") {
      appendLog(
        process.env,
        `record-human-approval ${outcome} session=${input?.session_id}`
      );
    }
  } catch (error) {
    appendLog(process.env, `record-human-approval error ${error.message}`);
  }
  process.exit(0);
}
