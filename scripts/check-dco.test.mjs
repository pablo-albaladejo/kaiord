import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dcoProblems,
  isOutsideContributor,
  parseCommits,
} from "./check-dco.mjs";

const commit = (overrides) => ({
  sha: "a".repeat(40),
  authorEmail: "ana@example.test",
  parents: ["b".repeat(40)],
  signOffs: ["Ana <ana@example.test>"],
  ...overrides,
});

describe("check-dco", () => {
  it("should hold a pull request from an outside contributor to the sign-off, and no one else", () => {
    // Arrange
    const authors = [
      { association: "NONE", userType: "User" },
      { association: "FIRST_TIME_CONTRIBUTOR", userType: "User" },
      { association: "CONTRIBUTOR", userType: "User" },
      { association: "OWNER", userType: "User" },
      { association: "MEMBER", userType: "User" },
      { association: "COLLABORATOR", userType: "User" },
      { association: "NONE", userType: "Bot" },
    ];

    // Act
    const outside = authors.map(isOutsideContributor);

    // Assert
    assert.deepEqual(outside, [true, true, true, false, false, false, false]);
  });

  it("should pass a commit signed off by its author, whatever the case of the email", () => {
    // Arrange
    const commits = [commit({ signOffs: ["Ana <ANA@example.test>"] })];

    // Act
    const problems = dcoProblems(commits);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should name each commit with no sign-off, or one signed off by someone else", () => {
    // Arrange
    const commits = [
      commit({ sha: "1".repeat(40), signOffs: [] }),
      commit({ sha: "2".repeat(40), signOffs: ["Bea <bea@example.test>"] }),
    ];

    // Act
    const problems = dcoProblems(commits);

    // Assert
    assert.deepEqual(problems, [
      "1111111: no Signed-off-by line for its author ana@example.test",
      "2222222: no Signed-off-by line for its author ana@example.test",
    ]);
  });

  it("should not ask a merge commit for a sign-off", () => {
    // Arrange
    const commits = [
      commit({ parents: ["b".repeat(40), "c".repeat(40)], signOffs: [] }),
    ];

    // Act
    const problems = dcoProblems(commits);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should read each commit's author, parents and sign-offs from the git log it formats", () => {
    // Arrange
    const log = [
      `${"1".repeat(40)}\x1fana@example.test\x1f${"0".repeat(40)}\x1fAna <ana@example.test>\x1dAna B <ana@b.test>\x1e`,
      `\n${"2".repeat(40)}\x1fbea@example.test\x1f${"0".repeat(40)} ${"9".repeat(40)}\x1f\x1e\n`,
    ].join("");

    // Act
    const commits = parseCommits(log);

    // Assert
    assert.deepEqual(commits, [
      {
        sha: "1".repeat(40),
        authorEmail: "ana@example.test",
        parents: ["0".repeat(40)],
        signOffs: ["Ana <ana@example.test>", "Ana B <ana@b.test>"],
      },
      {
        sha: "2".repeat(40),
        authorEmail: "bea@example.test",
        parents: ["0".repeat(40), "9".repeat(40)],
        signOffs: [],
      },
    ]);
  });
});
