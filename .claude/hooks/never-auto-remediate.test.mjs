// Tests for .claude/hooks/never-auto-remediate.cjs (R-NeverAutoRemediate).
//
// Unit cases go through `evaluate`; the CLI cases feed hook-input JSON on
// stdin and read the exit code and stdout, as Claude Code does.

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const { evaluate } = require("./never-auto-remediate.cjs");
const { gitEnv } = require("./guard-common.cjs");

const HOOK = join(
  dirname(fileURLToPath(import.meta.url)),
  "never-auto-remediate.cjs"
);
const onBranch = (branch) => ({ currentBranch: () => branch });
const feature = onBranch("feat/x");

const DENIED = [
  ["npm publish", "npm-publish"],
  ["pnpm -r publish --access public", "npm-publish"],
  ["pnpm --filter @kaiord/core publish", "npm-publish"],
  ["pnpm exec changeset publish", "npm-publish"],
  ["npx changeset publish", "npm-publish"],
  ["yarn npm publish", "npm-publish"],
  ["npm dist-tag add @kaiord/core@1.0.0 latest", "npm-publish"],
  ["bash scripts/changeset-publish.sh", "npm-publish"],
  ["git push origin main", "prod-deploy"],
  ["git push origin HEAD:main", "prod-deploy"],
  ["git -C ../main push origin main", "prod-deploy"],
  ["git push --tags", "release-tags"],
  ["git push origin @kaiord/core@1.2.3", "release-tags"],
  ["git push origin :refs/tags/v1.0.0", "release-tags"],
  ["git push --delete origin @kaiord/cli@2.0.0", "release-tags"],
  ["git push origin --delete changeset-release/main", "release-tags"],
  ["git push -f origin feat/x", "force-push"],
  ["git push --force-with-lease", "force-push"],
  ["git push origin +feat/x", "force-push"],
  ["gh release create @kaiord/core@1.0.0", "release-tags"],
  ["node scripts/create-github-releases.js", "release-tags"],
  ["gh workflow run release.yml", "prod-deploy"],
  ["gh workflow run deploy-site.yml --ref main", "prod-deploy"],
  ["node scripts/cws-api.mjs publish", "prod-deploy"],
  ["node scripts/cws-api.mjs upload --source bridge.zip", "prod-deploy"],
  ["gh secret set CWS_SERVICE_ACCOUNT_KEY", "repo-settings"],
  ["gh variable delete FOO", "repo-settings"],
  ["gh repo edit --default-branch dev", "repo-settings"],
  ["gh pr merge 12 --admin --squash", "repo-settings"],
  ["gh api -X PUT repos/pablo-albaladejo/kaiord/rulesets/1", "repo-settings"],
  ["gh api repos/o/r/actions/secrets/X -f encrypted_value=x", "repo-settings"],
  ["gh api --method DELETE repos/o/r/git/refs/tags/v1", "repo-settings"],
  ["gh workflow disable codeql.yml", "security-workflows"],
  ["gh workflow run 123456", "prod-deploy"],
  ["npx @changesets/cli publish", "npm-publish"],
  ["pnpm --filter @kaiord/core exec npm publish", "npm-publish"],
  ["pnpm -r exec changeset publish", "npm-publish"],
  ["pnpm -r dlx changeset publish", "npm-publish"],
  ["npm exec changeset publish", "npm-publish"],
  ["npm x changeset publish", "npm-publish"],
  ["npm exec --package=@changesets/cli -- changeset publish", "npm-publish"],
  ["pnpm --filter x exec git push origin main", "prod-deploy"],
  ['npm exec -c "git push origin main"', "prod-deploy"],
  [
    'gh api graphql -f query="mutation { deleteRef(input: {refId: \\"x\\"}) { clientMutationId } }"',
    "repo-settings",
  ],
  ["kaiord garmin push workout.fit", "athlete-data"],
  [
    "gh api repos/o/r/git/refs -f ref=refs/tags/v1.0.0 -f sha=abc",
    "release-tags",
  ],
  [
    "gh api repos/o/r/git/refs -F ref=refs/tags/v1.0.0 -f sha=abc",
    "release-tags",
  ],
  [
    "gh api repos/o/r/git/refs --raw-field ref=refs/tags/v1 -f sha=a",
    "release-tags",
  ],
  [
    "gh api repos/o/r/git/refs --field=ref=refs/tags/v1 -f sha=a",
    "release-tags",
  ],
  ["gh api repos/o/r/git/refs --input body.json", "release-tags"],
  [
    "gh api repos/o/r/git/tags -f tag=v1.0.0 -f message=m -f object=abc",
    "release-tags",
  ],
  [
    "gh api repos/o/r/git/refs -f ref=refs/heads/main -f sha=abc",
    "prod-deploy",
  ],
  ["gh api repos/o/r/merges -f base=main -f head=feat/x", "prod-deploy"],
  ["gh api repos/o/r/merges --input body.json", "prod-deploy"],
  [
    "gh api -X PUT repos/o/r/contents/a.txt -f branch=main -f message=m",
    "prod-deploy",
  ],
  [
    "gh api -X PUT repos/o/r/contents/a.txt -f message=m -f content=Zg==",
    "prod-deploy",
  ],
  ["gh api -X DELETE repos/o/r/contents/a.txt -f branch=main", "prod-deploy"],
  ["gh pr merge 12 --admin=true --squash", "repo-settings"],
  ["git push -o --dry-run origin main", "prod-deploy"],
  ["git push --push-option --dry-run origin main", "prod-deploy"],
  ['env -S "git push origin main"', "prod-deploy"],
  ['env --split-string="git push origin main"', "prod-deploy"],
  ['env -S "npm publish"', "npm-publish"],
  ["pnpm --filter @kaiord/cli dev garmin push workout.fit", "athlete-data"],
  ["wrangler deploy", "prod-deploy"],
  ["npx wrangler deploy", "prod-deploy"],
  ["npx wrangler@4 deploy", "prod-deploy"],
  ["npx wrangler@4 deploy --config scripts/geo/wrangler.toml", "prod-deploy"],
  ["pnpm exec wrangler deploy", "prod-deploy"],
  ["pnpm dlx wrangler@4 deploy", "prod-deploy"],
  ["pnpm --filter @kaiord/mcp-worker exec wrangler deploy", "prod-deploy"],
  ["pnpm wrangler deploy", "prod-deploy"],
  ["node_modules/.bin/wrangler deploy", "prod-deploy"],
  ["cd packages/mcp-worker && npx wrangler@4 deploy", "prod-deploy"],
  ["wrangler --config wrangler.toml deploy", "prod-deploy"],
  ["wrangler deploy --dry-run=false", "prod-deploy"],
  ["npx wrangler@4 delete", "prod-deploy"],
  ["pnpm exec wrangler delete --name kaiord-mcp", "prod-deploy"],
  ["npx wrangler rollback", "prod-deploy"],
  ["pnpm dlx wrangler@4 rollback abc --message m", "prod-deploy"],
  ["npx wrangler@4 versions deploy abc@100%", "prod-deploy"],
  ["pnpm exec wrangler versions deploy", "prod-deploy"],
  ["npx wrangler@4 triggers deploy", "prod-deploy"],
  ["wrangler triggers deploy -e production", "prod-deploy"],
];

const WRAPPED = [
  "cd packages/core && npm publish",
  "echo ok; npm publish",
  "FOO=1 npm publish",
  "sudo -u root npm publish",
  "rtk git push origin main",
  "timeout 60 npm publish",
  'bash -c "npm publish"',
  "echo $(npm publish)",
  "bash <<EOF\nnpm publish\nEOF",
  "if git diff --quiet; then git push origin main; fi",
  "for p in a b; do npm publish; done",
  "{ git push origin main; }",
  "! gh release create v1.0.0",
  "git push origin 2>&1 | tail -5",
  "git push origin >/dev/null",
  "git status # it's fine\ngit push origin main",
  "git \\\n  push origin main",
  "pnpm \\\n  publish -r",
];

const ALLOWED = [
  "git push",
  "git push -u origin feat/x",
  "git push origin --delete feat/old",
  "git push --dry-run origin HEAD:main",
  "npm publish --dry-run",
  "git tag -d v1.0.0",
  "npm view @kaiord/core",
  "pnpm exec vitest run",
  'git commit -m "npm publish later"',
  "gh pr create --title t --body \"$(cat <<'EOF'\ngit push --tags && npm publish\nEOF\n)\"",
  "cat <<EOF\nnpm publish\nEOF",
  "gh api repos/o/r/rulesets",
  "gh api repos/o/r/git/refs -f ref=refs/heads/feat/x -f sha=abc",
  "gh api repos/o/r/git/refs",
  "gh api repos/o/r/git/tags/abc",
  "gh api repos/o/r/merges",
  "gh api -X PUT repos/o/r/contents/a.txt -f branch=feat/x -f message=m",
  "gh api -X PUT repos/o/r/pulls/12/merge -f merge_method=squash",
  "gh api -X PUT repos/o/r/pulls/12/reviews/5/dismissals -f message=m",
  "gh pr merge 12 --admin=false --squash",
  "git push -o ci.skip origin feat/x",
  "gh api -X POST repos/o/r/issues/1/comments -f body=x",
  "gh workflow run ci.yml",
  "gh release view v1",
  "gh secret list",
  "node scripts/cws-api.mjs check abc",
  "echo garmin push",
  "cat scripts/changeset-publish.sh",
  "pnpm --filter @kaiord/core exec vitest run",
  "npm exec vitest",
  "git add scripts/changeset-publish.sh scripts/create-github-releases.js",
  "git diff scripts/cws-api.mjs",
  "git push -u origin feat/x 2>&1 | tail -3",
  "ls 2>/dev/null > out.txt",
  "gh api graphql -f query='{ viewer { login } }'",
  "wrangler deploy --dry-run --outdir dist",
  "npx wrangler@4 deploy --dry-run",
  "pnpm exec wrangler deploy --dry-run=true",
  "pnpm --filter @kaiord/mcp-worker build",
  "npx wrangler@4 dev",
  "npx wrangler@4 tail kaiord-mcp",
  "npx wrangler@4 versions list",
  "npx wrangler@4 versions upload",
  "npx wrangler@4 whoami",
  "echo wrangler deploy",
  'git commit -m "wrangler deploy later"',
  "cat wrangler.toml",
];

const runHook = (input) => {
  const state = mkdtempSync(join(tmpdir(), "never-auto-remediate-"));
  try {
    return spawnSync(process.execPath, [HOOK], {
      input: typeof input === "string" ? input : JSON.stringify(input),
      encoding: "utf8",
      env: { ...gitEnv(), TMPDIR: state },
    });
  } finally {
    rmSync(state, { recursive: true, force: true });
  }
};

describe("DENY — the never-auto-remediate classes", () => {
  for (const [command, rule] of DENIED) {
    it(`should deny \`${command}\` as ${rule}`, () => {
      // Arrange
      const ctx = feature;

      // Act
      const hit = evaluate(command, ctx);

      // Assert
      assert.equal(hit?.rule, rule);
    });
  }

  it("should deny a bare `git push` while on main", () => {
    // Arrange
    const ctx = onBranch("main");

    // Act
    const hit = evaluate("git push", ctx);

    // Assert
    assert.equal(hit?.rule, "prod-deploy");
  });
});

describe("DENY — the branch is read where the push runs", () => {
  // A context whose branch depends on the directory, like contextFor().
  const worktrees = (dirs, at = ".") => ({
    currentBranch: () => dirs[at],
    at: (dir) => worktrees(dirs, dir),
  });

  it("should follow `cd X &&` and `git -C X` to the worktree on main", () => {
    // Arrange
    const ctx = worktrees({ ".": "feat/x", "../kaiord": "main" });

    // Act
    const viaCd = evaluate("cd ../kaiord && git push", ctx);
    const viaC = evaluate("git -C ../kaiord push", ctx);
    const here = evaluate("git push", ctx);

    // Assert
    assert.equal(viaCd?.rule, "prod-deploy");
    assert.equal(viaC?.rule, "prod-deploy");
    assert.equal(here, null);
  });

  it("should allow `git -C X push` from main when X is a feature worktree", () => {
    // Arrange
    const ctx = worktrees({ ".": "main", "../feat": "feat/y" });

    // Act
    const hit = evaluate("git -C ../feat push", ctx);

    // Assert
    assert.equal(hit, null);
  });
});

describe("DENY — spellings that hide the command", () => {
  for (const command of WRAPPED) {
    it(`should see through ${JSON.stringify(command)}`, () => {
      // Arrange
      const ctx = onBranch("main");

      // Act
      const hit = evaluate(command, ctx);

      // Assert
      assert.ok(hit, `expected a denial for ${command}`);
    });
  }
});

describe("ALLOW — ordinary work", () => {
  for (const command of ALLOWED) {
    it(`should allow ${JSON.stringify(command)}`, () => {
      // Arrange
      const ctx = feature;

      // Act
      const hit = evaluate(command, ctx);

      // Assert
      assert.equal(hit, null);
    });
  }
});

describe("CLI — hook input JSON to hook output", () => {
  it("should print a deny decision that tells the agent to escalate", () => {
    // Arrange
    const input = {
      session_id: "s1",
      cwd: process.cwd(),
      tool_name: "Bash",
      tool_input: { command: "npm publish" },
    };

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 0);
    const out = JSON.parse(result.stdout).hookSpecificOutput;
    assert.equal(out.permissionDecision, "deny");
    assert.match(
      out.permissionDecisionReason,
      /NEVER-AUTO-REMEDIATE \[npm-publish\]/
    );
    assert.match(out.permissionDecisionReason, /message Pablo/);
  });

  it("should print nothing for an allowed command", () => {
    // Arrange
    const input = {
      session_id: "s1",
      cwd: process.cwd(),
      tool_name: "Bash",
      tool_input: { command: "pnpm test" },
    };

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 0);
    assert.equal(result.stdout, "");
  });

  it("should fail closed with exit 2 on unreadable input", () => {
    // Arrange
    const input = "not json";

    // Act
    const result = runHook(input);

    // Assert
    assert.equal(result.status, 2);
    assert.match(result.stderr, /fail closed/);
  });
});
