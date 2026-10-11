import assert from "node:assert/strict";
import { test } from "node:test";

import { ESLint } from "eslint";

const SPA = "packages/workout-spa-editor/src/components";
const IN_SCOPE = `${SPA}/molecules/WellnessEntryDialog/WellnessEntryForm.tsx`;
const OUT_OF_SCOPE = `${SPA}/organisms/ZonesConflictDialog/ConflictGroup.tsx`;

const literalsIn = async (code, filePath) => {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
  const [result] = await eslint.lintText(code, { filePath });
  // A parse failure reports no rule hits at all, which would pass the
  // out-of-scope case for the wrong reason.
  assert.deepEqual(
    result.messages.filter((m) => m.fatal),
    []
  );
  return result.messages.filter(
    (m) => m.ruleId === "local/no-jsx-literal-text"
  );
};

const component = (body) => `export function Probe() {\n  return ${body};\n}\n`;

test("should reject literal copy in a translated directory", async () => {
  // Arrange
  const code = component("<p>Save wellness</p>");

  // Act
  const messages = await literalsIn(code, IN_SCOPE);

  // Assert
  assert.equal(messages.length, 1);
  assert.equal(messages[0].severity, 2);
});

test("should leave a directory outside the scope alone", async () => {
  // Arrange
  const code = component("<p>Save wellness</p>");

  // Act
  const messages = await literalsIn(code, OUT_OF_SCOPE);

  // Assert
  assert.equal(messages.length, 0);
});

test("should let allow-listed units through in scope", async () => {
  // Arrange
  const code = component("<span>kcal</span>");

  // Act
  const messages = await literalsIn(code, IN_SCOPE);

  // Assert
  assert.equal(messages.length, 0);
});

test("should skip test files inside the scope", async () => {
  // Arrange
  const code = component("<p>Save wellness</p>");
  const filePath = IN_SCOPE.replace(/\.tsx$/, ".__virt.test.tsx");

  // Act
  const messages = await literalsIn(code, filePath);

  // Assert
  assert.equal(messages.length, 0);
});
