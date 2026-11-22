import { strict as assert } from "node:assert";
import { test } from "node:test";

import { failureReport, SHOWN } from "./guard-failure.mjs";

test("should print a summary with the count and every problem when there are three or fewer", () => {
  // Arrange
  const problems = ["a.html: no meta", "b.html: no meta"];

  // Act
  const report = failureReport("content security policy problem(s)", problems);

  // Assert
  assert.equal(
    report,
    "❌ 2 content security policy problem(s):\n  a.html: no meta\n  b.html: no meta"
  );
});

test("should print only the first three problems and count the rest", () => {
  // Arrange
  const problems = ["p1", "p2", "p3", "p4", "p5"];

  // Act
  const report = failureReport("violation(s)", problems);

  // Assert
  assert.equal(SHOWN, 3);
  assert.equal(report, "❌ 5 violation(s):\n  p1\n  p2\n  p3\n  …and 2 more");
});

test("should end with the remediation line when one is given", () => {
  // Arrange
  const problems = ["p1"];

  // Act
  const report = failureReport("violation(s)", problems, "Fix: do X.");

  // Assert
  assert.equal(report, "❌ 1 violation(s):\n  p1\n  Fix: do X.");
});
