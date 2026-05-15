/**
 * Status-decision matrix for resolveLiveVersion.
 *
 * Exposes:
 *   - latestTagVersion(gitTags, packageName): pick the highest `<pkg>@*` tag
 *     by lexicographic sort (the resolver does not parse semver — it compares
 *     whatever strings the caller feeds it). Returns null when no tag matches.
 *   - decideStatus(ctx): given gitTagVersion, publishedVersion, localVersion,
 *     and forceStuck, return { source, version, status, warnings }. Pushes a
 *     `state_mismatch` warning into ctx.warnings when tag and PUBLISHED
 *     disagree (status forced to UNTRUSTED_STATE).
 *
 * Status precedence (highest first):
 *   UNTRUSTED_STATE > STUCK_DRAFT > DRAFT_AHEAD > SYNCED
 */

import { stateMismatchWarning } from "./live-version-warnings.mjs";

export function latestTagVersion(gitTags, packageName) {
  if (!Array.isArray(gitTags) || gitTags.length === 0) return null;
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}@(.+)$`);
  const versions = [];
  for (const tag of gitTags) {
    const m = re.exec(tag);
    if (m) versions.push(m[1]);
  }
  if (versions.length === 0) return null;
  versions.sort();
  return versions[versions.length - 1];
}

export function decideStatus(ctx) {
  const { gitTagVersion, publishedVersion, localVersion, forceStuck } = ctx;
  const source =
    gitTagVersion !== null
      ? "git_tag"
      : publishedVersion !== null
        ? "api_PUBLISHED"
        : "unknown";
  const version = gitTagVersion ?? publishedVersion ?? null;
  if (
    gitTagVersion !== null &&
    publishedVersion !== null &&
    gitTagVersion !== publishedVersion
  ) {
    ctx.warnings.push(stateMismatchWarning(gitTagVersion, publishedVersion));
    return {
      source,
      version,
      status: "UNTRUSTED_STATE",
      warnings: ctx.warnings,
    };
  }
  if (forceStuck) {
    return { source, version, status: "STUCK_DRAFT", warnings: ctx.warnings };
  }
  if (localVersion !== null && version !== null && localVersion !== version) {
    return { source, version, status: "DRAFT_AHEAD", warnings: ctx.warnings };
  }
  return { source, version, status: "SYNCED", warnings: ctx.warnings };
}
