import assert from "node:assert/strict";
import { test } from "node:test";

import { ESLint } from "eslint";

const SPA = "packages/workout-spa-editor/src";
const IN_SCOPE = `${SPA}/components/molecules/WellnessEntryDialog/WellnessEntryForm.tsx`;
const ANY_COMPONENT = `${SPA}/components/organisms/ZonesConflictDialog/ConflictGroup.tsx`;
const HOOK = `${SPA}/hooks/use-push-to-garmin-op.ts`;
const USE_CASE = `${SPA}/application/ai-workout-processor.ts`;

const literalsIn = async (
  code,
  filePath,
  ruleId = "local/no-jsx-literal-text"
) => {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
  const [result] = await eslint.lintText(code, { filePath });
  // A parse failure reports no rule hits at all, which would pass the
  // out-of-scope case for the wrong reason.
  assert.deepEqual(
    result.messages.filter((m) => m.fatal),
    []
  );
  return result.messages.filter((m) => m.ruleId === ruleId);
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

test("should reject literal copy in any component of the App", async () => {
  // Arrange
  const code = component('<p>{open ? "Hide" : "Detail"}</p>');

  // Act
  const messages = await literalsIn(code, ANY_COMPONENT);

  // Assert
  assert.equal(messages.length, 2);
});

test("should reject a literal toast in a hook of the App", async () => {
  // Arrange
  const code = 'export const probe = (toast) => toast.error("Save failed");\n';

  // Act
  const messages = await literalsIn(code, HOOK, "local/no-literal-copy");

  // Assert
  assert.equal(messages.length, 1);
  assert.equal(messages[0].severity, 2);
});

test("should leave a pure use case to the layer that words it", async () => {
  // Arrange
  const code =
    'export const probe = () => ({ ok: false, message: "No steps" });\n';

  // Act
  const messages = await literalsIn(code, USE_CASE, "local/no-literal-copy");

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

test("should allow a keyboard letter on the shortcut sheet only", async () => {
  // Arrange
  const code = component("<kbd>{`${mod}G`}</kbd>");
  const sheet = `${SPA}/components/organisms/ShortcutSheet/ShortcutSheetGroup.tsx`;
  const menu = `${SPA}/components/organisms/EditorContextMenu/EditActions.tsx`;

  // Act
  const onSheet = await literalsIn(code, sheet);
  const onMenu = await literalsIn(code, menu);

  // Assert
  assert.equal(onSheet.length, 0);
  assert.equal(onMenu.length, 1);
});

test("should allow KRD and GCN on import and export file-type surfaces only", async () => {
  // Arrange
  const code = 'export const LABELS = { krd: "KRD", gcn: "GCN" };\n';
  const exportSurface = `${SPA}/components/molecules/ExportFormatSelector/format-options.ts`;

  // Act
  const onExport = await literalsIn(
    code,
    exportSurface,
    "local/no-literal-copy"
  );
  const onOther = await literalsIn(code, HOOK, "local/no-literal-copy");

  // Assert
  assert.equal(onExport.length, 0);
  assert.equal(onOther.length, 2);
});
