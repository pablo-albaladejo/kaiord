// The trigger and job rules of R-SecurityAuditAlwaysReports, read by
// `check-security-audit-required.mjs` from the parsed security.yml.

export const AUDIT_JOB_NAME = "Dependency Security Audit";

const PR_FILTERS = ["paths", "paths-ignore", "branches", "branches-ignore"];
const DEFAULT_PR_TYPES = ["opened", "synchronize", "reopened"];
const JOB_SKIPPERS = ["if", "needs", "strategy", "continue-on-error"];

export function triggerViolations(on) {
  const violations = [];
  if (!on || typeof on !== "object" || !("pull_request" in on)) {
    return ["security.yml has no pull_request trigger"];
  }
  const pr = on.pull_request ?? {};
  for (const key of PR_FILTERS.filter((k) => k in pr)) {
    violations.push(
      `pull_request is filtered by \`${key}\`: a PR it excludes never gets the required check and cannot merge`
    );
  }
  if ("types" in pr) {
    const types = [pr.types].flat();
    const missing = DEFAULT_PR_TYPES.filter((t) => !types.includes(t));
    if (missing.length > 0) {
      violations.push(
        `pull_request \`types\` omits ${missing.join(", ")}: those PR events would not report the check`
      );
    }
  }
  if (![on.push?.branches].flat().includes("main")) {
    violations.push("security.yml no longer audits every push to main");
  }
  return violations;
}

const hasFailStep = (steps, condition) =>
  steps.some(
    (s) =>
      typeof s?.if === "string" &&
      s.if.includes(condition) &&
      /\bexit 1\b/.test(s?.run ?? "")
  );

export function jobViolations(jobs) {
  const named = Object.entries(jobs ?? {}).filter(
    ([, job]) => job?.name === AUDIT_JOB_NAME
  );
  if (named.length !== 1) {
    return [
      `expected exactly one job named "${AUDIT_JOB_NAME}" (branch protection matches this exact name), found ${named.length}`,
    ];
  }
  const [id, job] = named[0];
  const violations = JOB_SKIPPERS.filter((k) => k in job).map(
    (k) =>
      `job "${id}" sets \`${k}\` at job level: it can skip, rename or soften the required check`
  );
  const steps = Array.isArray(job.steps) ? job.steps : [];
  if (!hasFailStep(steps, "has_critical == 'true'")) {
    violations.push(`job "${id}" never fails on a high or critical finding`);
  }
  if (!hasFailStep(steps, "parsed != 'true'")) {
    violations.push(
      `job "${id}" does not fail when the audit produced no report`
    );
  }
  return violations;
}
