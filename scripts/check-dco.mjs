#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { failIfAny } from "./lib/guard-failure.mjs";

// Developer Certificate of Origin (CONTRIBUTING.md, "Sign off your
// commits"). A pull request opened by an outside contributor must carry, on
// every commit it adds, a `Signed-off-by:` trailer with the commit author's
// email. Outside means GitHub's author_association for the pull request is
// none of OWNER, MEMBER or COLLABORATOR, and the author is not a bot. The
// owner's and the agents' pull requests are not held to it: their commits
// carry agent co-author trailers, not sign-offs, and the nightly and release
// automation would fail. A merge commit adds no authored change of its own,
// so it needs none. Run by .github/workflows/dco.yml on pull requests.

const INSIDE = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export const isOutsideContributor = ({ association, userType }) =>
  userType !== "Bot" && !INSIDE.has(association);

const emailOf = (signOff) => /<([^>]+)>\s*$/.exec(signOff)?.[1].toLowerCase();

export const dcoProblems = (commits) =>
  commits
    .filter((c) => c.parents.length < 2)
    .filter(
      (c) => !c.signOffs.some((s) => emailOf(s) === c.authorEmail.toLowerCase())
    )
    .map(
      (c) =>
        `${c.sha.slice(0, 7)}: no Signed-off-by line for its author ${c.authorEmail}`
    );

export const LOG_FORMAT =
  "%H%x1f%ae%x1f%P%x1f%(trailers:key=Signed-off-by,valueonly,separator=%x1d)%x1e";

export const parseCommits = (log) =>
  log
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha, authorEmail, parents, signOffs] = record.split("\x1f");
      return {
        sha,
        authorEmail,
        parents: parents.split(" ").filter(Boolean),
        signOffs: signOffs
          .split("\x1d")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    });

const SHA = /^[0-9a-f]{40}$/;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env;
  const author = {
    association: env.DCO_AUTHOR_ASSOCIATION,
    userType: env.DCO_AUTHOR_TYPE,
  };
  if (!isOutsideContributor(author)) {
    console.log(
      `✅ DCO: not an outside contributor (${author.association}, ${author.userType}); no sign-off required`
    );
    process.exit(0);
  }
  if (!SHA.test(env.DCO_BASE ?? "") || !SHA.test(env.DCO_HEAD ?? ""))
    failIfAny("DCO problem(s)", ["DCO_BASE and DCO_HEAD must be commit shas"]);
  const log = execFileSync(
    "git",
    ["log", `--format=${LOG_FORMAT}`, `${env.DCO_BASE}..${env.DCO_HEAD}`],
    { encoding: "utf8" }
  );
  failIfAny(
    "commit(s) without a sign-off",
    dcoProblems(parseCommits(log)),
    'Sign off each commit with `git commit -s` (or `git rebase --signoff` on the branch); see CONTRIBUTING.md, "Sign off your commits".'
  );
  console.log("✅ DCO: every commit is signed off by its author");
}
