// Runs an allowed method-note pipeline with no shell: each stage is spawned
// with its own argv, and the output of one is the input of the next.

import { spawnSync } from "node:child_process";

import { cleanGitEnv } from "./clean-git-env.mjs";

// No user or system git config, no hook's GIT_* variables, no fsmonitor,
// pager or signature helper: git reads the repository and nothing else.
export const pipelineEnv = (env = process.env) => ({
  ...Object.fromEntries(
    Object.entries(cleanGitEnv(env)).filter(([k]) => !k.startsWith("GREP"))
  ),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_TERMINAL_PROMPT: "0",
});
const SAFE_GIT = [
  "-c",
  "core.fsmonitor=false",
  "-c",
  "log.showSignature=false",
  "--no-pager",
];

// Node treats an empty `input` as absent and lets the child inherit stdin,
// so a first stage that reads it would wait on the caller's terminal.
const spawn = (root, [name, ...args], input) =>
  spawnSync(name, name === "git" ? [...SAFE_GIT, ...args] : args, {
    cwd: root,
    ...(input ? { input } : { stdio: ["ignore", "pipe", "pipe"] }),
    encoding: "utf8",
    env: pipelineEnv(),
    maxBuffer: 64 * 1024 * 1024,
  });

// `grep -c` exits 1 when it counts zero, so the answer is the output, not
// the exit code; a command that prints nothing has failed.
export const repoGit = (root) => ({
  run: (stages) =>
    stages
      .reduce((input, argv) => spawn(root, argv, input).stdout ?? "", "")
      .trim() || null,
  hasCommit: (sha) =>
    /^[0-9a-f]{7,40}$/.test(sha) &&
    spawn(root, ["git", "cat-file", "-e", `${sha}^{commit}`], "").status === 0,
});
