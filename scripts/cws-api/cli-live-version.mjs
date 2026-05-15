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

// Pure args builder. Extracted so a unit test can verify the canonical
// package-name shape (`@kaiord/<name>`) without spawning a child process.
// The resolver's regex expects packageName to match the tag prefix, so
// the CLI must prepend the npm-scope even when the workflow matrix
// passes a bare name like `train2go-bridge`.
export function buildResolveArgs(id, flags, getItemFn, gitTags) {
  return {
    extensionId: id,
    packageName: `@kaiord/${flags.package}`,
    localVersion: flags.local ?? null,
    getItem: getItemFn,
    gitTags,
  };
}

export async function runLiveVersion(id, flags, serviceAccount) {
  const bound = (_sa, itemId, projection) =>
    getItem(serviceAccount, itemId, projection);
  return resolveLiveVersion(
    buildResolveArgs(id, flags, bound, readGitTags(flags.package))
  );
}
