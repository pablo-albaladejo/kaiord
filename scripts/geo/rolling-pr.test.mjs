import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BRANCH,
  findRollingPr,
  planRestore,
  selectRollingPr,
} from "./rolling-pr.mjs";

const REPO = "pablo-albaladejo/kaiord";
const SHA = "0123456789abcdef0123456789abcdef01234567";

const pull = (number, fullName, ref = BRANCH) => ({
  number,
  state: "open",
  head: { ref, repo: { full_name: fullName } },
});

const fakeGh = (pulls) => {
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    return JSON.stringify(pulls);
  };
  return { calls, gh };
};

const fakeGit = (lsRemote) => (args) => {
  assert.deepEqual(args, [
    "ls-remote",
    "--heads",
    "origin",
    `refs/heads/${BRANCH}`,
  ]);
  return lsRemote;
};

describe("selectRollingPr", () => {
  it("should ignore a fork's PR from a branch with the same name", () => {
    // Arrange
    const pulls = [pull(9001, "attacker/kaiord"), pull(1270, REPO)];

    // Act
    const number = selectRollingPr(pulls, { repo: REPO });

    // Assert
    assert.equal(number, 1270);
  });

  it("should find nothing when only a fork has the branch", () => {
    // Arrange
    const pulls = [pull(9001, "attacker/kaiord")];

    // Act
    const number = selectRollingPr(pulls, { repo: REPO });

    // Assert
    assert.equal(number, null);
  });

  it("should ignore a same-repo PR from another branch", () => {
    // Arrange
    const pulls = [pull(5, REPO, "auto/seo-observatory-123")];

    // Act
    const number = selectRollingPr(pulls, { repo: REPO });

    // Assert
    assert.equal(number, null);
  });
});

describe("findRollingPr", () => {
  it("should ask for open PRs headed by the repo owner's branch", () => {
    // Arrange
    const { calls, gh } = fakeGh([pull(1270, REPO)]);

    // Act
    const number = findRollingPr({ repo: REPO, gh });

    // Assert
    assert.equal(number, 1270);
    assert.deepEqual(calls, [
      [
        "api",
        `repos/${REPO}/pulls?state=open&per_page=100&head=pablo-albaladejo:${BRANCH}`,
      ],
    ]);
  });
});

describe("planRestore", () => {
  it("should restore the branch while its PR is open", () => {
    // Arrange
    const git = fakeGit(`${SHA}\trefs/heads/${BRANCH}\n`);
    const { gh } = fakeGh([pull(1270, REPO)]);

    // Act
    const plan = planRestore({ repo: REPO, git, gh });

    // Assert
    assert.deepEqual([plan.restore, plan.lease, plan.pr], [true, SHA, "1270"]);
  });

  it("should start from main when the PR was closed unmerged", () => {
    // Arrange
    const git = fakeGit(`${SHA}\trefs/heads/${BRANCH}\n`);
    const { gh } = fakeGh([]);

    // Act
    const plan = planRestore({ repo: REPO, git, gh });

    // Assert
    assert.deepEqual([plan.restore, plan.lease, plan.pr], [false, SHA, ""]);
    assert.match(plan.reason, /no open PR/);
  });

  it("should start from main without a lease when the branch was deleted", () => {
    // Arrange
    const git = fakeGit("");
    const { calls, gh } = fakeGh([pull(1270, REPO)]);

    // Act
    const plan = planRestore({ repo: REPO, git, gh });

    // Assert
    assert.deepEqual([plan.restore, plan.lease, plan.pr], [false, "", ""]);
    assert.equal(calls.length, 0);
  });

  it("should not restore from a fork's PR even though the branch exists", () => {
    // Arrange
    const git = fakeGit(`${SHA}\trefs/heads/${BRANCH}\n`);
    const { gh } = fakeGh([pull(9001, "attacker/kaiord")]);

    // Act
    const plan = planRestore({ repo: REPO, git, gh });

    // Assert
    assert.equal(plan.restore, false);
  });
});
