import { ESLint } from "eslint";
import { test } from "node:test";
import assert from "node:assert/strict";

test("should respect held-out Dexie override for CAT-B match", async () => {
  // Arrange
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });

  // Act
  // Use a `.test.ts` virtual path so the test-files override disables
  // `projectService: true`. Production-code blocks require the file to
  // exist in tsconfig.json's `include`, which a virtual file does not.
  const results = await eslint.lintText(
    "/** Extracted from X to keep file under the lint limit */\nexport const x = 1;\n",
    {
      filePath: "packages/workout-spa-editor/src/adapters/dexie/__virt.test.ts",
    }
  );

  // Assert
  const narrativeMessages = results[0].messages.filter(
    (m) => m.ruleId === "local/no-narrative-comments"
  );
  assert.equal(narrativeMessages.length, 0);
});

test("should fire on CAT-B match outside held-out path", async () => {
  // Arrange
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });

  // Act
  const results = await eslint.lintText(
    "/** Extracted from X to keep file under the lint limit */\nexport const x = 1;\n",
    { filePath: "packages/core/src/__virt.test.ts" }
  );

  // Assert
  const narrativeMessages = results[0].messages.filter(
    (m) => m.ruleId === "local/no-narrative-comments"
  );
  assert.equal(narrativeMessages.length, 1);
});
