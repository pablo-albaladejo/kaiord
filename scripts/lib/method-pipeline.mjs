// A method-note command, checked before anything runs. Each stage must be
// one of the few commands the note needs, with only the options it uses:
// git rev-list / log / ls-tree on one revision, then grep (-c, -v, -e) and
// wc -l reading their input only. Anything else is refused, so the note can
// never start a program, write a file, or read outside the repository.

import { deniedWord, pipelineWords } from "./method-pipeline-words.mjs";

const REV = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}Z)?$/;
const REPO_PATH = /^[A-Za-z0-9._-][A-Za-z0-9._/-]*$/;

const GIT = {
  "rev-list": { flags: ["--count"], values: {}, paths: "none" },
  log: {
    flags: ["--merges"],
    values: { "--format": /^.+$/, "--since": DATE, "--until": DATE },
    paths: "after --",
  },
  "ls-tree": { flags: ["-d", "--name-only"], values: {}, paths: "after rev" },
};

const insideRepo = (p) => REPO_PATH.test(p) && !p.split("/").includes("..");

const gitArgProblem = (sub, spec, arg) => {
  if (spec.flags.includes(arg)) return null;
  const [name, value] = arg.split(/=(.*)/s);
  return spec.values[name]?.test(value ?? "") ? null : `git ${sub} ${name}`;
};

const gitProblem = ([sub, ...args]) => {
  if (sub === undefined || sub.startsWith("-"))
    return "an option before the git subcommand";
  const spec = GIT[sub];
  if (!spec) return `git ${sub}, which is not an allowed subcommand`;
  const revs = [];
  let paths = false;
  for (const arg of args) {
    if (paths || (spec.paths === "after rev" && revs.length === 1)) {
      if (!insideRepo(arg)) return `the path ${arg}, outside the repository`;
    } else if (arg === "--" && spec.paths === "after --") paths = true;
    else if (arg.startsWith("-")) {
      const problem = gitArgProblem(sub, spec, arg);
      if (problem) return `${problem}, which is not an allowed option`;
    } else if (REV.test(arg)) revs.push(arg);
    else return `git ${sub} ${arg}, which is not a revision`;
  }
  return revs.length === 1 ? null : `${revs.length} revisions instead of 1`;
};

const grepProblem = (args) => {
  const byOption = args.includes("-e");
  let patterns = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-e" && i + 1 < args.length) {
      patterns++;
      i++;
    } else if (args[i] === "-c" || args[i] === "-v") continue;
    else if (args[i].startsWith("-")) return `grep ${args[i]}`;
    else if (!byOption && patterns === 0) patterns++;
    else return `the grep operand ${args[i]} (grep reads its input only)`;
  }
  return patterns > 0 ? null : "grep with no pattern";
};

const STAGE = {
  grep: grepProblem,
  wc: (args) => (args.join(" ") === "-l" ? null : "wc without -l alone"),
};

// { stages: [argv, ...], revision } when allowed, else { error }: what in
// the command was refused, phrased to follow "it has".
export const parsePipeline = (command) => {
  const { stages, error } = pipelineWords(command);
  if (error) return { error };
  const refused = stages.map(deniedWord).find(Boolean);
  if (refused) return { error: `the refused option ${refused}` };
  const [[first, ...gitArgs], ...rest] = stages;
  if (first !== "git") return { error: `${first} as its first command` };
  const problem =
    gitProblem(gitArgs) ??
    rest
      .map(([name, ...args]) =>
        STAGE[name] ? STAGE[name](args) : `${name}, which is not grep or wc`
      )
      .find(Boolean);
  if (problem) return { error: problem };
  const revision = gitArgs.slice(1).find((a) => REV.test(a));
  return { stages, revision };
};
