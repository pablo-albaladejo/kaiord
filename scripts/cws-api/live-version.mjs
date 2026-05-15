/**
 * resolveLiveVersion — combined source-of-truth resolver.
 *
 * Inputs (strings only; the resolver does not parse semver):
 *   - localVersion        — what the workflow is about to publish.
 *   - api_PUBLISHED       — from `getItem(_, _, "PUBLISHED")`; may 400.
 *   - git_tag_latest      — highest `<packageName>@*` entry in `gitTags`.
 *
 * Status enum (no free-form strings):
 *   - SYNCED             — local matches the chosen live version (or no
 *                          local supplied) AND tag/PUBLISHED do not conflict.
 *   - DRAFT_AHEAD        — local differs from the live version; a new
 *                          release is in flight.
 *   - STUCK_DRAFT        — caller passes `forceStuck: true` (the workflow
 *                          owns the staleness clock; Phase 3 wiring).
 *   - UNTRUSTED_STATE    — git tag and api_PUBLISHED both present and
 *                          disagree; operator must reconcile.
 *
 * warnings[] shape: { code, severity: "info" | "warn" | "error", message }.
 *   - published_projection_400 (warn) — PUBLISHED projection threw
 *     CwsStateError; falls back to git_tag.
 *   - git_tag_missing          (warn) — no `<packageName>@*` tag found;
 *     falls back to api_PUBLISHED if available.
 *   - state_mismatch          (error) — tag and PUBLISHED disagree;
 *     forces UNTRUSTED_STATE.
 *
 * `source`: "git_tag" | "api_PUBLISHED" | "unknown".
 * `version`: the resolved live version string, or null if unknown.
 */

import { CwsStateError } from "./errors.mjs";
import { decideStatus, latestTagVersion } from "./live-version-status.mjs";
import {
  gitTagMissingWarning,
  publishedProjection400Warning,
} from "./live-version-warnings.mjs";

export class UsageError extends Error {
  constructor(message) {
    super(`[UsageError] ${message}`);
    this.name = "UsageError";
  }
}

async function fetchPublishedVersion(getItem, extensionId, warnings) {
  try {
    const item = await getItem(undefined, extensionId, "PUBLISHED");
    return item?.crxVersion ?? null;
  } catch (err) {
    if (!(err instanceof CwsStateError)) throw err;
    warnings.push(publishedProjection400Warning(err));
    return null;
  }
}

export async function resolveLiveVersion({
  extensionId,
  packageName,
  localVersion = null,
  getItem,
  gitTags,
  forceStuck = false,
}) {
  if (!extensionId) throw new UsageError("extensionId is required");
  if (!packageName) throw new UsageError("packageName is required");
  if (typeof getItem !== "function") {
    throw new UsageError("getItem must be a function");
  }
  const warnings = [];
  const gitTagVersion = latestTagVersion(gitTags, packageName);
  if (gitTagVersion === null) {
    warnings.push(gitTagMissingWarning(packageName));
  }
  const publishedVersion = await fetchPublishedVersion(
    getItem,
    extensionId,
    warnings
  );
  return decideStatus({
    gitTagVersion,
    publishedVersion,
    localVersion,
    forceStuck,
    warnings,
  });
}
