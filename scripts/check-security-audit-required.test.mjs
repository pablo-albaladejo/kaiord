// Tests for scripts/check-security-audit-required.mjs (R-SecurityAuditAlwaysReports).

import { deepStrictEqual, ok } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  AUDIT_JOB_NAME,
  findViolations,
  SECURITY_WORKFLOW,
} from "./check-security-audit-required.mjs";

// A security.yml shaped like the real one. Each option breaks one invariant.
const workflow = ({
  prTrigger = "  pull_request:\n",
  pushTrigger = "  push:\n    branches:\n      - main\n",
  name = AUDIT_JOB_NAME,
  jobExtra = "",
  failOnHigh = true,
  failOnNoReport = true,
} = {}) => `
name: Security Audit
on:
${prTrigger}${pushTrigger}  workflow_dispatch:
jobs:
  audit:
    name: ${name}
    runs-on: ubuntu-latest
    timeout-minutes: 4
${jobExtra}    steps:
      - name: Run security audit
        id: audit
        run: pnpm audit --prod --json > audit-results.json || true
${
  failOnNoReport
    ? `      - name: Fail if no report
        if: steps.scope.outputs.run == 'true' && steps.audit.outputs.parsed != 'true'
        run: exit 1
`
    : ""
}${
  failOnHigh
    ? `      - name: Fail on high
        if: steps.audit.outputs.has_critical == 'true'
        run: |
          echo "high"
          exit 1
`
    : ""
}`;

describe("findViolations", () => {
  it("should accept a workflow whose audit job always reports on pull requests", () => {
    // Arrange
    const src = workflow();

    // Act
    const violations = findViolations(src);

    // Assert
    deepStrictEqual(violations, []);
  });

  it("should reject a pull_request trigger filtered by paths", () => {
    // Arrange
    const src = workflow({
      prTrigger: '  pull_request:\n    paths:\n      - "package.json"\n',
    });

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes("paths")));
  });

  it("should reject any other pull_request filter that can leave a PR without the check", () => {
    // Arrange
    const filters = [
      "    paths-ignore:\n      - docs/**\n",
      "    branches:\n      - release\n",
      "    branches-ignore:\n      - main\n",
      "    types: [opened]\n",
    ];

    // Act
    const results = filters.map((f) =>
      findViolations(workflow({ prTrigger: `  pull_request:\n${f}` }))
    );

    // Assert
    for (const violations of results) ok(violations.length > 0);
  });

  it("should reject a workflow with no pull_request trigger", () => {
    // Arrange
    const src = workflow({ prTrigger: "" });

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes("pull_request")));
  });

  it("should reject a workflow that no longer audits pushes to main", () => {
    // Arrange
    const src = workflow({ pushTrigger: "" });

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes("push")));
  });

  it("should reject a renamed audit job, because branch protection matches the name", () => {
    // Arrange
    const src = workflow({ name: "Dependency audit" });

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes(AUDIT_JOB_NAME)));
  });

  it("should reject job-level settings that skip, rename or soften the check", () => {
    // Arrange
    const extras = [
      "    if: github.event_name != 'pull_request'\n",
      "    needs: [detect]\n",
      "    continue-on-error: true\n",
      "    strategy:\n      matrix:\n        node: [22, 24]\n",
    ];

    // Act
    const results = extras.map((jobExtra) =>
      findViolations(workflow({ jobExtra }))
    );

    // Assert
    for (const violations of results) ok(violations.length > 0);
  });

  it("should reject an audit job that never fails on a high or critical finding", () => {
    // Arrange
    const src = workflow({ failOnHigh: false });

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes("high or critical")));
  });

  it("should reject an audit job that passes when the audit produced no report", () => {
    // Arrange
    const src = workflow({ failOnNoReport: false });

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes("no report")));
  });

  it("should report malformed YAML instead of throwing", () => {
    // Arrange
    const src = "on: [unclosed";

    // Act
    const violations = findViolations(src);

    // Assert
    ok(violations.some((v) => v.includes("YAML")));
  });
});

describe("the real security.yml", () => {
  it("should satisfy R-SecurityAuditAlwaysReports", () => {
    // Arrange
    const src = readFileSync(SECURITY_WORKFLOW, "utf8");

    // Act
    const violations = findViolations(src);

    // Assert
    deepStrictEqual(violations, []);
  });
});
