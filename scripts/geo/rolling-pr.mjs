#!/usr/bin/env node
// Finds the observatory's rolling PR and decides whether this week's run may
// restore the data on its branch (scripts/geo/union-timeseries.mjs).
//
//   node scripts/geo/rolling-pr.mjs plan   # restore=, lease=, pr= for $GITHUB_OUTPUT
//   node scripts/geo/rolling-pr.mjs find   # the open rolling PR number, or nothing
//
// Only a PR whose head is the branch in THIS repository counts. A fork can
// open a PR from a branch with the same name, and `gh pr list --head` matches
// it; editing or restoring from it would let anyone write the metrics PR.
//
// The branch is restored only while its PR is open. A PR closed unmerged
// means its data was rejected: restoring the branch would bring it back every
// week. A deleted branch has nothing to restore. In both cases the run starts
// from main; `lease` is still the branch's current SHA (empty when it does not
// exist) so the push that replaces it is not blind.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const BRANCH = "auto/seo-observatory";

export function selectRollingPr(pulls, { repo, branch = BRANCH }) {
  const pr = pulls.find(
    (p) =>
      p.state === "open" &&
      p.head?.ref === branch &&
      p.head?.repo?.full_name === repo
  );
  return pr ? pr.number : null;
}

export function findRollingPr({ repo, branch = BRANCH, gh }) {
  const owner = repo.split("/")[0];
  const path = `repos/${repo}/pulls?state=open&per_page=100&head=${owner}:${branch}`;
  return selectRollingPr(JSON.parse(gh(["api", path])), { repo, branch });
}

export function planRestore({ repo, branch = BRANCH, git, gh }) {
  const out = git(["ls-remote", "--heads", "origin", `refs/heads/${branch}`]);
  const lease = out.trim().split(/\s+/)[0] ?? "";
  if (lease === "") {
    return { restore: false, lease, pr: "", reason: "no rolling branch" };
  }
  const pr = findRollingPr({ repo, branch, gh });
  if (pr === null) {
    return {
      restore: false,
      lease,
      pr: "",
      reason: `${branch} has no open PR in ${repo} (closed unmerged?): starting from main`,
    };
  }
  return {
    restore: true,
    lease,
    pr: String(pr),
    reason: `restoring ${branch} from open PR #${pr}`,
  };
}

const run = (cmd) => (args) =>
  execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = process.env.GITHUB_REPOSITORY;
  const command = process.argv[2];
  if (!repo || !["plan", "find"].includes(command)) {
    console.error("usage: GITHUB_REPOSITORY=o/r rolling-pr.mjs plan|find");
    process.exit(2);
  }
  if (command === "find") {
    console.log(findRollingPr({ repo, gh: run("gh") }) ?? "");
  } else {
    const plan = planRestore({ repo, git: run("git"), gh: run("gh") });
    console.error(`[rolling-pr] ${plan.reason}`);
    console.log(`restore=${plan.restore}\nlease=${plan.lease}\npr=${plan.pr}`);
  }
}
