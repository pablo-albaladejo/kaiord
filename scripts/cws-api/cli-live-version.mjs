// live-version subcommand handler — called by cli.mjs dispatch.
// Reads git tags via execFileSync and delegates to resolveLiveVersion.

import { execFileSync } from "node:child_process";
import { getItem } from "./state.mjs";
import { resolveLiveVersion } from "./live-version.mjs";

function readGitTags(packageName) {
  const out = execFileSync("git", ["tag", "-l", `@kaiord/${packageName}@*`], {
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

export async function runLiveVersion(id, flags, serviceAccount) {
  const bound = (_sa, itemId, projection) =>
    getItem(serviceAccount, itemId, projection);
  // The resolver's regex expects packageName to match the tag prefix
  // (`@kaiord/<name>@<version>`). The CLI receives the bare workspace
  // name (e.g. `train2go-bridge`) from the workflow matrix, so prepend
  // the npm-scope here. readGitTags below already hard-codes the same
  // prefix in its `git tag -l` query.
  const fullName = `@kaiord/${flags.package}`;
  return resolveLiveVersion({
    extensionId: id,
    packageName: fullName,
    localVersion: flags.local ?? null,
    getItem: bound,
    gitTags: readGitTags(flags.package),
  });
}
