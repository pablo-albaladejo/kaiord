/**
 * Typed warning builders for resolveLiveVersion.
 *
 * Each builder returns a shape: { code, severity, message }.
 *   - "published_projection_400" (warn): getItem(PUBLISHED) threw CwsStateError.
 *   - "git_tag_missing"          (warn): no `<packageName>@*` tag was found.
 *   - "state_mismatch"           (error): git tag and PUBLISHED disagree.
 *
 * Codes are fixed (not free-form strings) so downstream renderers can branch
 * on `code` without parsing message text.
 */

export function publishedProjection400Warning(err) {
  return {
    code: "published_projection_400",
    severity: "warn",
    message: `getItem(PUBLISHED) failed: ${err.message}`,
  };
}

export function gitTagMissingWarning(packageName) {
  return {
    code: "git_tag_missing",
    severity: "warn",
    message: `no git tag matching ${packageName}@* was found`,
  };
}

export function stateMismatchWarning(gitTagVersion, publishedVersion) {
  return {
    code: "state_mismatch",
    severity: "error",
    message: `git tag ${gitTagVersion} disagrees with PUBLISHED ${publishedVersion}`,
  };
}
