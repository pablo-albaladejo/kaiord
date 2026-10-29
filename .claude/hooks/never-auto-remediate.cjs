#!/usr/bin/env node
// PreToolUse(Bash) guard: commands an agent must NEVER run on its own
// (R-NeverAutoRemediate, spec/agent-guardrails).
//
// Each class below touches something Kaiord ships to people: the npm
// packages (release.yml publishes on push to main), the release tags and
// GitHub releases, kaiord.com (deploy-site.yml, GitHub Pages), the Chrome Web
// Store listings (cws-publish.yml, scripts/cws-api.mjs), the repository's
// settings, rules and secrets, and a real athlete's Garmin Connect account.
// The agent diagnoses, gathers evidence, opens an issue and messages Pablo;
// he runs the command himself with `!`.
//
// This is a tripwire, not a sandbox. It parses the command the way a shell
// would split it (operators, quotes, `bash -c`, `$(...)`), so the common
// spellings are caught, but a command assembled at run time — a variable, a
// script file, a heredoc piped into a shell — is invisible to it.
const os = require("os");
const path = require("path");
const { appendLog, git, parseInput, readStdin } = require("./guard-common.cjs");

const ESCALATE =
  "Do NOT retry, rephrase or work around this. Diagnose, collect the evidence, " +
  "open an issue, and message Pablo with the exact command: he runs it himself " +
  "with `!`. See CLAUDE.md, 'Never auto-remediate'.";

// ---------------------------------------------------------------- tokenizing

const OPERATORS = ["&&", "||", ";;", "|&", ";", "|", "&", "\n", "(", ")"];

const SHELLS = ["bash", "sh", "zsh", "dash"];
const HEREDOC = /^<<(-?)\s*(['"]?)([A-Za-z_][\w-]*)\2/;

// Split a command line into simple commands (arrays of words), honouring
// quotes and backslashes. `$(...)` and backtick bodies are lifted out and
// parsed as commands of their own. A heredoc body is data (a commit message,
// a PR body) and is skipped, unless it is fed to a shell.
function splitCommands(line) {
  const commands = [];
  const nested = [];
  const heredocs = [];
  let words = [];
  let word = null;
  let quote = null;
  let dropNext = false; // the next word is a redirection target
  const endWord = () => {
    if (word !== null) {
      if (dropNext) dropNext = false;
      else words.push(word);
    }
    word = null;
  };
  const endCommand = () => {
    endWord();
    dropNext = false;
    if (words.length > 0) commands.push(words);
    words = [];
  };

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else word += ch;
      continue;
    }
    if (ch === "\\" && line[i + 1] === "\n") {
      i++; // line continuation joins the two lines
      continue;
    }
    if (ch === "\\" && i + 1 < line.length) {
      word = (word ?? "") + line[++i];
      continue;
    }
    if ((ch === "$" && line[i + 1] === "(") || ch === "`") {
      const open = ch === "`" ? 1 : 2;
      const end =
        ch === "`" ? line.indexOf("`", i + 1) : matchParen(line, i + 1);
      const stop = end === -1 ? line.length : end;
      nested.push(line.slice(i + open, stop));
      word = (word ?? "") + "$SUBST";
      i = stop;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else word += ch;
      continue;
    }
    if (ch === "#" && word === null) {
      const nl = line.indexOf("\n", i);
      i = (nl === -1 ? line.length : nl) - 1; // a comment runs to end of line
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      word = word ?? "";
      continue;
    }
    const doc = line[i + 2] !== "<" && HEREDOC.exec(line.slice(i));
    if (doc) {
      endWord();
      const head = words.length > 0 ? words[0].split("/").pop() : "";
      heredocs.push({
        strip: doc[1] === "-",
        delim: doc[3],
        shell: SHELLS.includes(head),
      });
      i += doc[0].length - 1;
      continue;
    }
    if (ch === "\n" && heredocs.length > 0) {
      endCommand();
      i = skipHeredocs(line, i + 1, heredocs.splice(0), nested) - 1;
      continue;
    }
    // Redirections (`>f`, `2>&1`, `&>f`, `<f`) are not arguments: drop the
    // operator, its fd number and its target so they never read as refspecs.
    if (ch === ">" || ch === "<" || line.startsWith("&>", i)) {
      if (word !== null && /^\d+$/.test(word)) word = null;
      else endWord();
      let j = ch === "&" ? i + 2 : i + 1;
      while (/[<>|]/.test(line[j] ?? "")) j++;
      if (line[j] === "&") {
        j++;
        while (/[\d-]/.test(line[j] ?? "")) j++;
      } else dropNext = true;
      i = j - 1;
      continue;
    }
    const op = OPERATORS.find((o) => line.startsWith(o, i));
    if (op) {
      endCommand();
      i += op.length - 1;
      continue;
    }
    if (/\s/.test(ch)) {
      endWord();
      continue;
    }
    word = (word ?? "") + ch;
  }
  endCommand();
  return [...commands, ...nested.flatMap(splitCommands)];
}

// Consume heredoc bodies starting at `from`; return the index after the last
// terminator line. Bodies fed to a shell are queued as commands.
function skipHeredocs(line, from, docs, nested) {
  let pos = from;
  for (const doc of docs) {
    const body = [];
    while (pos < line.length) {
      const end = line.indexOf("\n", pos);
      const text = line.slice(pos, end === -1 ? line.length : end);
      pos = end === -1 ? line.length : end + 1;
      if ((doc.strip ? text.replace(/^\t+/, "") : text) === doc.delim) break;
      body.push(text);
    }
    if (doc.shell) nested.push(body.join("\n"));
  }
  return pos;
}

function matchParen(line, open) {
  let depth = 0;
  for (let i = open; i < line.length; i++) {
    if (line[i] === "(") depth++;
    else if (line[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

const base = (word) => word.split("/").pop();

// Wrappers that run the rest of the line as a command.
const WRAPPERS = {
  sudo: { valued: ["-u", "-g", "-C", "-h", "-p"] },
  env: { valued: ["-u", "-C", "-S"] },
  command: { valued: [] },
  exec: { valued: ["-a"] },
  nohup: { valued: [] },
  time: { valued: [] },
  nice: { valued: ["-n"] },
  caffeinate: { valued: ["-t", "-w"] },
  xargs: { valued: ["-I", "-n", "-P", "-L", "-s", "-E", "-d"] },
  npx: { valued: ["-p", "--package"] },
  bunx: { valued: [] },
};

// Shell grammar words that may lead a command and hide the real program.
const KEYWORDS = new Set([
  "if",
  "then",
  "elif",
  "else",
  "while",
  "until",
  "do",
  "!",
  "{",
  "}",
]);

// Strip wrappers and environment assignments until the real program leads.
// Returns a list because `bash -c '...'` and `eval` expand to new commands.
function normalize(words) {
  let w = words.slice();
  for (let guard = 0; guard < 20 && w.length > 0; guard++) {
    const head = base(w[0]);
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0]) || KEYWORDS.has(w[0])) {
      w = w.slice(1);
    } else if (head === "rtk") {
      w = w.slice(w[1] === "proxy" ? 2 : 1);
    } else if (head === "timeout" || head === "gtimeout") {
      w = skipFlags(w.slice(1), ["-s", "-k", "--signal", "--kill-after"]).slice(
        1
      );
    } else if (head === "env" && splitStringArg(w)) {
      // `env -S "git push origin main"` splits its argument into a command.
      return splitCommands(splitStringArg(w)).flatMap(normalize);
    } else if (WRAPPERS[head]) {
      w = skipFlags(w.slice(1), WRAPPERS[head].valued);
    } else if (["pnpm", "yarn", "npm"].includes(head)) {
      // `pnpm --filter x exec …`, `pnpm -r dlx …`, `npm exec …`, `npm x …`:
      // the runner verb may follow leading flags.
      const rest = w.slice(1);
      let i = 0;
      while (i < rest.length && rest[i].startsWith("-"))
        i += NPM_VALUED.includes(rest[i]) ? 2 : 1;
      const verbs = head === "npm" ? ["exec", "x"] : ["exec", "dlx"];
      if (!verbs.includes(rest[i])) return [w];
      const args = rest.slice(i + 1);
      // `npm exec -c '<cmd>'` runs a command string.
      const call = args.findIndex((a) => a === "-c" || a === "--call");
      if (call !== -1 && args[call + 1] !== undefined)
        return splitCommands(args[call + 1]).flatMap(normalize);
      w = skipFlags(args, ["-p", "--package", ...NPM_VALUED]);
    } else if (SHELLS.includes(head)) {
      const c = w.findIndex((x) => /^-[a-z]*c[a-z]*$/.test(x));
      if (c !== -1 && w[c + 1] !== undefined)
        return splitCommands(w[c + 1]).flatMap(normalize);
      return [w];
    } else if (head === "eval") {
      return splitCommands(w.slice(1).join(" ")).flatMap(normalize);
    } else {
      return [w];
    }
  }
  return w.length > 0 ? [w] : [];
}

// The argument of `env -S` / `--split-string` (plus the words after it).
function splitStringArg(w) {
  for (let i = 1; i < w.length; i++) {
    if (!w[i].startsWith("-")) return null;
    if (w[i] === "-S" || w[i] === "--split-string")
      return w.slice(i + 1).join(" ") || null;
    if (w[i].startsWith("--split-string="))
      return [w[i].slice(15), ...w.slice(i + 1)].join(" ");
    if (/^-S./.test(w[i])) return [w[i].slice(2), ...w.slice(i + 1)].join(" ");
  }
  return null;
}

// Drop leading flags (and the values of flags known to take one).
function skipFlags(w, valued) {
  let i = 0;
  while (i < w.length && w[i].startsWith("-") && w[i] !== "--") {
    i += valued.includes(w[i]) ? 2 : 1;
  }
  if (w[i] === "--") i++;
  return w.slice(i);
}

// Positional (non-flag) words after skipping valued flags.
function positionals(w, valued) {
  const out = [];
  for (let i = 0; i < w.length; i++) {
    if (w[i] === "--") return out.concat(w.slice(i + 1));
    if (w[i].startsWith("-")) {
      if (valued.includes(w[i])) i++;
      continue;
    }
    out.push(w[i]);
  }
  return out;
}

// --------------------------------------------------------------------- rules

const NPM_VALUED = [
  "--filter",
  "-F",
  "-C",
  "--dir",
  "--prefix",
  "--workspace",
  "--otp",
  "--tag",
  "--access",
  "--registry",
];

function npmRule(w) {
  const tool = base(w[0]);
  if (!["npm", "pnpm", "yarn", "bun"].includes(tool)) return null;
  const pos = positionals(w.slice(1), NPM_VALUED);
  let [sub, action] = pos;
  if (
    (sub === "npm" && tool === "yarn") ||
    sub === "changeset" ||
    sub === "changesets"
  ) {
    [sub, action] = pos.slice(1);
  }
  if (sub === "publish" && w.includes("--dry-run")) return null;
  if (["publish", "unpublish", "deprecate", "undeprecate"].includes(sub))
    return {
      rule: "npm-publish",
      why: `\`${tool} ${sub}\` changes what is published on npm`,
    };
  if (
    ["dist-tag", "dist-tags"].includes(sub) &&
    ["add", "rm", "set"].includes(action)
  )
    return {
      rule: "npm-publish",
      why: `\`${tool} ${sub} ${action}\` moves an npm release tag`,
    };
  if (sub === "owner" && ["add", "rm"].includes(action))
    return { rule: "npm-publish", why: "`npm owner` changes who can publish" };
  if (sub === "access" && action && !["list", "get", "ls"].includes(action))
    return {
      rule: "npm-publish",
      why: "`npm access` changes package visibility or grants",
    };
  return null;
}

function changesetRule(w) {
  const head = base(w[0]);
  if (
    (head === "changeset" ||
      head === "changesets" ||
      /^@changesets\/cli(@|$)/.test(w[0])) &&
    positionals(w.slice(1), [])[0] === "publish"
  )
    return {
      rule: "npm-publish",
      why: "`changeset publish` publishes every pending package to npm",
    };
  return null;
}

const RELEASE_SCRIPTS = [
  [
    /(^|\/)changeset-publish\.sh$/,
    "npm-publish",
    "scripts/changeset-publish.sh publishes to npm",
  ],
  [
    /(^|\/)create-github-releases\.js$/,
    "release-tags",
    "scripts/create-github-releases.js creates GitHub releases",
  ],
];

const INTERPRETERS = ["bash", "sh", "zsh", "dash", "node", "tsx", "ts-node"];

function scriptRule(w) {
  // Only when the script is what runs: `cat`/`git add` of it is fine.
  const ran = INTERPRETERS.includes(base(w[0]))
    ? skipFlags(w.slice(1), [])[0]
    : w[0];
  for (const word of [ran ?? ""]) {
    for (const [re, rule, why] of RELEASE_SCRIPTS)
      if (re.test(word)) return { rule, why };
  }
  const cws = /(^|\/)cws-api\.mjs$/.test(ran ?? "") ? w.indexOf(ran) : -1;
  if (cws !== -1) {
    const action = positionals(w.slice(cws + 1), [
      "--source",
      "--version",
      "--timeout-ms",
    ])[0];
    if (action === "upload" || action === "publish")
      return {
        rule: "prod-deploy",
        why: `\`cws-api.mjs ${action}\` ships to the Chrome Web Store`,
      };
  }
  return null;
}

// `kaiord garmin push`, however the CLI is launched (bin, dist/bin/kaiord.js,
// tsx src/bin/kaiord.ts, pnpm --filter @kaiord/cli dev ...).
function garminRule(w) {
  for (let i = 1; i + 1 < w.length; i++) {
    const viaKaiord = w.slice(0, i).some((x) => /kaiord/.test(x));
    if (viaKaiord && w[i] === "garmin" && w[i + 1] === "push")
      return {
        rule: "athlete-data",
        why: "`garmin push` writes into a real athlete's Garmin Connect account",
      };
  }
  return null;
}

// Cloudflare Workers: a deploy, rollback or delete changes what kaiord.com
// serves (the route, the code, the Worker itself). `--dry-run` only bundles.
const WRANGLER = /^wrangler(@[^/]+)?$/;
const WRANGLER_VALUED = [
  "-c",
  "--config",
  "-e",
  "--env",
  "--env-file",
  "--profile",
  "--cwd",
  "--name",
  "--outdir",
  "--message",
  "--tag",
  "--version-id",
  "--compatibility-date",
];
const WRANGLER_DEPLOYS = [
  ["deploy"],
  ["delete"],
  ["rollback"],
  ["versions", "deploy"],
  ["triggers", "deploy"],
  // A secret change deploys a new version of the Worker at once.
  ["secret", "put"],
  ["secret", "delete"],
  ["secret", "bulk"],
];

// Where the wrangler bin leads: `wrangler …`, or `pnpm [flags] wrangler …`
// and `yarn wrangler …`, which run a local bin directly; `bun x` is `bunx`.
function wranglerArgs(w) {
  if (WRANGLER.test(base(w[0]))) return w.slice(1);
  if (!["pnpm", "yarn", "bun"].includes(base(w[0]))) return null;
  let rest = skipFlags(w.slice(1), NPM_VALUED);
  if (base(w[0]) === "bun" && rest[0] === "x")
    rest = skipFlags(rest.slice(1), NPM_VALUED);
  return WRANGLER.test(base(rest[0] ?? "")) ? rest.slice(1) : null;
}

function wranglerRule(w) {
  const args = wranglerArgs(w);
  if (args === null) return null;
  if (args.some((a) => a === "--dry-run" || /^--dry-run=(?!false$)/.test(a)))
    return null;
  const pos = positionals(args, WRANGLER_VALUED);
  const hit = WRANGLER_DEPLOYS.find((cmd) =>
    cmd.every((part, i) => pos[i] === part)
  );
  if (!hit) return null;
  return {
    rule: "prod-deploy",
    why: `\`wrangler ${hit.join(" ")}\` changes a live Cloudflare Worker or its kaiord.com route`,
  };
}

const PROTECTED_BRANCH = /^(main|master|changeset-release\/.+)$/;
const TAG_LIKE = /(^refs\/tags\/)|(^|@)v?\d+\.\d+\.\d+([-+][\w.]+)?$/;
const GIT_GLOBAL_VALUED = [
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--exec-path",
];
const PUSH_VALUED = [
  "-o",
  "--push-option",
  "--repo",
  "--receive-pack",
  "--exec",
];

function gitPushRule(w, ctx) {
  if (base(w[0]) !== "git") return null;
  let i = 1;
  while (i < w.length && w[i].startsWith("-")) {
    // `git -C dir push` asks about the branch checked out in `dir`.
    if (w[i] === "-C" && w[i + 1] && ctx.at) ctx = ctx.at(w[i + 1]);
    i += GIT_GLOBAL_VALUED.includes(w[i]) ? 2 : 1;
  }
  if (w[i] !== "push") return null;
  const args = w.slice(i + 1);
  // Values of `-o`/`--push-option` etc. are not flags of push itself.
  const flags = [];
  for (let k = 0; k < args.length; k++) {
    if (!args[k].startsWith("-")) continue;
    flags.push(args[k]);
    if (PUSH_VALUED.includes(args[k])) k++;
  }
  const short = flags.filter((f) => /^-[a-zA-Z]+$/.test(f)).join("");
  const has = (...names) =>
    flags.some((f) => names.some((n) => f === n || f.startsWith(`${n}=`)));

  // A dry run contacts the remote but changes nothing on it.
  if (has("--dry-run") || short.includes("n")) return null;
  if (
    has("--force", "--force-with-lease", "--force-if-includes") ||
    short.includes("f")
  )
    return {
      rule: "force-push",
      why: "force-pushing rewrites published history",
    };
  if (has("--mirror", "--all", "--branches", "--prune"))
    return {
      rule: "release-tags",
      why: "`git push --mirror/--all/--prune` rewrites or deletes remote refs wholesale",
    };
  if (has("--tags", "--follow-tags"))
    return {
      rule: "release-tags",
      why: "pushing tags publishes releases (release tags are created by release.yml)",
    };

  const deleting = has("--delete") || short.includes("d");
  const [, ...refspecs] = positionals(args, PUSH_VALUED);
  if (refspecs.length === 0 && !deleting) {
    const branch = ctx.currentBranch();
    if (branch && PROTECTED_BRANCH.test(branch))
      return {
        rule: "prod-deploy",
        why: `a bare \`git push\` from \`${branch}\` pushes straight to it; a push to main deploys kaiord.com and publishes to npm`,
      };
    return null;
  }
  for (const spec of refspecs) {
    if (spec.startsWith("+"))
      return { rule: "force-push", why: `\`${spec}\` is a forced refspec` };
    const removal = deleting || spec.startsWith(":");
    const [src, dst = src] = spec.replace(/^:/, "").split(":");
    const target =
      (dst === "HEAD" || src === "HEAD") && !spec.includes(":")
        ? ctx.currentBranch() || "HEAD"
        : dst;
    const ref = target.replace(/^refs\/heads\//, "");
    if (TAG_LIKE.test(ref))
      return {
        rule: "release-tags",
        why: `\`${spec}\` ${removal ? "deletes" : "pushes"} a release tag`,
      };
    if (PROTECTED_BRANCH.test(ref))
      return removal
        ? {
            rule: "release-tags",
            why: `\`${spec}\` deletes the protected branch \`${ref}\``,
          }
        : {
            rule: "prod-deploy",
            why: `pushing to \`${ref}\` bypasses the PR; a push to main deploys kaiord.com and publishes to npm`,
          };
  }
  return null;
}

const GH_VALUED = ["-R", "--repo", "--hostname"];
const DEPLOY_WORKFLOW = /release|deploy|publish|cws|pages/i;

function ghRule(w) {
  if (base(w[0]) !== "gh") return null;
  const pos = positionals(w.slice(1), [
    ...GH_VALUED,
    "-X",
    "--method",
    "-H",
    "--header",
    "-f",
    "-F",
    "--field",
    "--raw-field",
    "--input",
    "-q",
    "--jq",
    "-t",
    "--template",
    "--cache",
    "-p",
    "--preview",
    "-b",
    "--body",
    "--title",
    "-m",
    "--subject",
    "--body-file",
    "--ref",
    "-r",
    "--notes",
    "-n",
    "--notes-file",
    "--target",
    "--env",
    "-e",
    "--org",
    "-o",
    "--app",
    "--visibility",
    "--description",
    "--homepage",
    "--add-topic",
    "--remove-topic",
    "--default-branch",
  ]);
  const [sub, action, target] = pos;
  const flags = w.slice(1).filter((x) => x.startsWith("-"));

  if (
    sub === "release" &&
    ["create", "delete", "edit", "upload", "delete-asset"].includes(action)
  )
    return {
      rule: "release-tags",
      why: `\`gh release ${action}\` changes a published GitHub release`,
    };
  if (
    (sub === "secret" || sub === "variable") &&
    ["set", "delete", "remove"].includes(action)
  )
    return {
      rule: "repo-settings",
      why: `\`gh ${sub} ${action}\` changes repository ${sub}s`,
    };
  if (
    sub === "repo" &&
    ["edit", "delete", "rename", "archive", "unarchive"].includes(action)
  )
    return {
      rule: "repo-settings",
      why: `\`gh repo ${action}\` changes repository settings`,
    };
  if (
    sub === "repo" &&
    action === "deploy-key" &&
    ["add", "delete"].includes(target)
  )
    return {
      rule: "repo-settings",
      why: "`gh repo deploy-key` changes repository access",
    };
  if (sub === "workflow" && ["disable", "enable"].includes(action))
    return {
      rule: "security-workflows",
      why: `\`gh workflow ${action}\` switches a workflow on or off`,
    };
  if (
    sub === "workflow" &&
    action === "run" &&
    (DEPLOY_WORKFLOW.test(target ?? "") || /^\d+$/.test(target ?? ""))
  )
    return {
      rule: "prod-deploy",
      why: `\`gh workflow run ${target}\` triggers a release or deploy`,
    };
  if (
    sub === "pr" &&
    action === "merge" &&
    flags.some((f) => f === "--admin" || /^--admin=(?!false$)/.test(f))
  )
    return {
      rule: "repo-settings",
      why: "`gh pr merge --admin` bypasses the repository's rules",
    };
  if (sub === "api") return ghApiRule(w);
  return null;
}

const SENSITIVE_API = [
  /^repos\/[^/]+\/[^/]+\/?$/,
  /^repos\/[^/]+\/[^/]+\/(rulesets|branches\/[^/]+\/protection|environments|hooks|collaborators|keys|pages|releases|dispatches|transfer|topics|vulnerability-alerts|automated-security-fixes|private-vulnerability-reporting|code-scanning|secret-scanning)(\/|$)/,
  /^repos\/[^/]+\/[^/]+\/actions\/(secrets|variables|permissions|workflows\/[^/]+\/(disable|enable|dispatches))(\/|$)/,
  /^repos\/[^/]+\/[^/]+\/git\/refs\/(tags\/|heads\/(main|master|changeset-release)(\/|$))/,
];

function ghApiRule(w) {
  const args = w.slice(w.indexOf("api") + 1);
  let method = null;
  let fields = false;
  let input = false;
  const values = {};
  let path = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const [flag, inline] = a.startsWith("--")
      ? a.split(/=(.*)/s)
      : [a, undefined];
    if (flag === "-X" || flag === "--method")
      method = (inline ?? args[++i] ?? "").toUpperCase();
    else if (/^-X./.test(a)) method = a.slice(2).toUpperCase();
    else if (["-f", "-F", "--field", "--raw-field", "--input"].includes(flag)) {
      fields = true;
      if (flag === "--input") input = true;
      else {
        const kv = inline ?? args[i + 1] ?? "";
        values[kv.split("=")[0].replace(/\[\]$/, "")] = kv.split(/=(.*)/s)[1];
      }
      if (inline === undefined) i++;
    } else if (
      [
        "-H",
        "--header",
        "-q",
        "--jq",
        "-t",
        "--template",
        "--hostname",
        "--cache",
        "-p",
        "--preview",
      ].includes(flag)
    ) {
      if (inline === undefined) i++;
    } else if (!a.startsWith("-") && path === null) path = a;
  }
  if (path === "graphql") {
    const body = args.join(" ");
    if (
      /\bmutation\b/i.test(body) &&
      /(Ref|Release|BranchProtection|Ruleset|Environment|Repository)\b/.test(
        body
      )
    )
      return {
        rule: "repo-settings",
        why: "a GraphQL mutation on refs, releases, rules or repository settings",
      };
    return null;
  }
  const verb = method || (fields ? "POST" : "GET");
  if (verb === "GET" || path === null) return null;
  const clean = path
    .replace(/^https:\/\/api\.github\.com\//, "")
    .replace(/^\//, "")
    .split("?")[0];
  const route = clean.match(/^repos\/[^/]+\/[^/]+\/(.*)$/)?.[1] ?? "";
  const protectedRef = (r) =>
    PROTECTED_BRANCH.test((r ?? "").replace(/^refs\/heads\//, ""));
  if (route === "git/tags" || route === "git/refs") {
    // Creating a ref/tag object: inspect `ref=`; a body file cannot be read.
    const ref = values.ref;
    if (route === "git/tags" || input || TAG_LIKE.test(ref ?? ""))
      return {
        rule: "release-tags",
        why: `\`gh api ${verb} ${clean}\` can create a release tag`,
      };
    if (protectedRef(ref))
      return {
        rule: "prod-deploy",
        why: `\`gh api ${verb} ${clean}\` creates a protected branch ref`,
      };
  }
  if (
    (route === "merges" && (input || protectedRef(values.base))) ||
    (/^contents\//.test(route) &&
      (input || values.branch === undefined || protectedRef(values.branch)))
  )
    return {
      rule: "prod-deploy",
      why: `\`gh api ${verb} ${clean}\` writes straight to a protected branch; a push to main deploys kaiord.com and publishes to npm`,
    };
  if (SENSITIVE_API.some((re) => re.test(clean)))
    return {
      rule: "repo-settings",
      why: `\`gh api -X ${verb} ${clean}\` changes repository settings, rules, secrets, releases or protected refs`,
    };
  return null;
}

const RULES = [
  npmRule,
  changesetRule,
  scriptRule,
  garminRule,
  wranglerRule,
  gitPushRule,
  ghRule,
];

function evaluate(command, ctx) {
  for (const words of splitCommands(String(command ?? ""))) {
    for (const w of normalize(words)) {
      // `cd X && git push` asks about the branch checked out in X.
      if (w[0] === "cd" && w[1] && ctx.at) {
        ctx = ctx.at(w[1]);
        continue;
      }
      for (const rule of RULES) {
        const hit = rule(w, ctx);
        if (hit) return { ...hit, command: w.join(" ") };
      }
    }
  }
  return null;
}

const contextFor = (cwd) => {
  let branch;
  return {
    at: (dir) =>
      contextFor(path.resolve(cwd, dir.replace(/^~(?=\/|$)/, os.homedir()))),
    currentBranch: () => {
      if (branch === undefined) {
        try {
          branch = git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
        } catch {
          branch = null;
        }
      }
      return branch;
    },
  };
};

const denial = (hit) => ({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: `NEVER-AUTO-REMEDIATE [${hit.rule}]: ${hit.why} (\`${hit.command}\`). ${ESCALATE}`,
  },
});

module.exports = { evaluate, normalize, splitCommands };

if (require.main === module) {
  const input = parseInput(readStdin());
  if (!input) {
    console.error(
      "never-auto-remediate: unreadable hook input; refusing the command (fail closed)."
    );
    process.exit(2);
  }
  if (input.tool_name !== "Bash") process.exit(0);
  const cwd = input.cwd || process.cwd();
  let hit;
  try {
    hit = evaluate(input.tool_input?.command, contextFor(cwd));
  } catch (err) {
    console.error(
      `never-auto-remediate: crashed (${err?.message}); refusing the command (fail closed).`
    );
    process.exit(2);
  }
  if (hit) {
    appendLog(
      process.env,
      `never-auto-remediate deny session=${input.session_id} rule=${hit.rule} cmd=${JSON.stringify(hit.command)}`
    );
    process.stdout.write(`${JSON.stringify(denial(hit))}\n`);
  }
  process.exit(0);
}
