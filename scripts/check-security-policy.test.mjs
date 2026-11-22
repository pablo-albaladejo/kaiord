import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  checkSecurityPolicy,
  SECURITY_MD,
  SECURITY_TXT,
} from "./check-security-policy.mjs";

const REPORT_URL =
  "https://github.com/pablo-albaladejo/kaiord/security/advisories/new";
const POLICY_URL =
  "https://github.com/pablo-albaladejo/kaiord/blob/main/SECURITY.md";
const CANONICAL = "https://kaiord.com/.well-known/security.txt";

const securityMd = (reportUrl = REPORT_URL) =>
  `# Security policy\n\nReport privately at ${reportUrl}.\n` +
  `The site publishes ${CANONICAL}.\n`;

const securityTxt = ({
  contact = REPORT_URL,
  expires = "2027-06-01T00:00:00.000Z",
  policy = POLICY_URL,
} = {}) =>
  [
    `Contact: ${contact}`,
    `Expires: ${expires}`,
    `Policy: ${policy}`,
    `Canonical: ${CANONICAL}`,
    "Preferred-Languages: en, es",
    "",
  ].join("\n");

const NOW = new Date("2026-11-22T00:00:00.000Z");

describe("check-security-policy", () => {
  it("should pass on the SECURITY.md and security.txt the repo ships", () => {
    // Arrange
    const files = {
      securityMd: readFileSync(SECURITY_MD, "utf8"),
      securityTxt: readFileSync(SECURITY_TXT, "utf8"),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: new Date() });

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should pass when both files name the same reporting address", () => {
    // Arrange
    const files = { securityMd: securityMd(), securityTxt: securityTxt() };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should fail when security.txt names a contact SECURITY.md does not", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt({ contact: "https://example.com/report" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /Contact .* not in SECURITY\.md/);
  });

  it("should fail when security.txt has no Contact", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt().replace(/^Contact:.*\n/m, ""),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /no Contact/);
  });

  it("should fail when the Policy field does not point to SECURITY.md", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt({ policy: "https://kaiord.com/security" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /Policy/);
  });

  it("should fail when Expires is within 30 days", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt({ expires: "2026-12-15T00:00:00.000Z" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /expires in 23 days/);
  });

  it("should fail when Expires is already past", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt({ expires: "2026-11-01T00:00:00.000Z" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /expired/);
  });

  it("should fail when Expires is more than a year ahead", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt({ expires: "2028-01-01T00:00:00.000Z" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /more than a year/);
  });

  it("should fail when Expires is not a date", () => {
    // Arrange
    const files = {
      securityMd: securityMd(),
      securityTxt: securityTxt({ expires: "soon" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    assert.match(problems.join("\n"), /Expires/);
  });

  it("should fail when either file holds an email address", () => {
    // Arrange
    const files = {
      securityMd: securityMd("mailto:someone@example.com"),
      securityTxt: securityTxt({ contact: "mailto:someone@example.com" }),
    };

    // Act
    const problems = checkSecurityPolicy({ ...files, now: NOW });

    // Assert
    const text = problems.join("\n");
    assert.match(text, /SECURITY\.md holds an email address/);
    assert.match(text, /security\.txt holds an email address/);
  });
});
