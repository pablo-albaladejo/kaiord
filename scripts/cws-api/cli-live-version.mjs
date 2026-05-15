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
  return resolveLiveVersion({
    extensionId: id,
    packageName: flags.package,
    localVersion: flags.local ?? null,
    getItem: bound,
    gitTags: readGitTags(flags.package),
  });
}
