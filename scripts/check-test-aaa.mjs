#!/usr/bin/env node
//
// Migration-state allowlist (drained to empty by PR-6). See design.md
// D5 "Two distinct allowlist patterns" for the distinction from the
// exception-allowlist pattern in scripts/check-no-pii-leakage.mjs.
//
// Rule R-ItBodyAAA.
//
// Enforces: every it()/it.<alias>(...) body in any in-scope
// *.test.{ts,tsx} file SHALL contain canonical Pascal-case line
// comments `// Arrange`, `// Act`, `// Assert` (case-sensitive,
// no trailing punctuation), one per `it()` call.
//
// Implementation: count-based heuristic — file is a violator if
// (#it-calls > #canonical-Arrange-markers) OR
// (#it-calls > #canonical-Act-markers) OR
// (#it-calls > #canonical-Assert-markers). The bootstrap script uses
// the same heuristic to seed the allowlists. Stricter checks (per-it
// ordering, blank-line separators) are spec-bound but not enforced
// at PR-1 ship-time; the migration's subagent prompt produces ordered
// + blank-line-separated markers, and PR-6 may tighten the heuristic.
//
// Three sharded allowlists per design D4 — disjoint sub-Sets so PR-3
// (BACKEND), PR-4 (SPA_NON_COMPONENT), PR-5 (SPA_COMPONENT) ship in
// parallel without merge conflicts on this file.
//
// CLI:
//   node scripts/check-test-aaa.mjs           # full-tree
//   node scripts/check-test-aaa.mjs --changed-files
//
// `--changed-files` mode mirrors check-test-title-should.mjs.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");

// MIGRATION-STATE ALLOWLISTS — sharded per D4. Each sub-Set is
// drained independently by its corresponding migration PR
// (PR-3 → BACKEND, PR-4 → SPA_NON_COMPONENT, PR-5 → SPA_COMPONENT).
// All three SHALL be `new Set()` after PR-5.
//
// Format: repo-relative POSIX file paths (no line numbers — file-
// level allowlist per D4).
let AAA_ALLOWLIST_BACKEND = new Set();

let AAA_ALLOWLIST_SPA_NON_COMPONENT = new Set([
  // Escape hatch: title literal contains the substring `it (` (matches the
  // count-based IT_CALL_RE heuristic as a 5th `it`-call), so the marker
  // counter expects 5 of each but only 4 it() bodies exist. The file IS
  // canonically compliant per the spec's per-it() rule. PR-6 §6.6 may
  // tighten the heuristic to disregard string-literal hits.
  "packages/workout-spa-editor/src/application/get-user-preferences.test.ts",
]);

let AAA_ALLOWLIST_SPA_COMPONENT = new Set([
  "packages/workout-spa-editor/src/App.test.tsx",
  "packages/workout-spa-editor/src/__perf__/profile-state-baseline.measure.test.tsx",
  "packages/workout-spa-editor/src/__regressions__/issue-385.test.tsx",
  "packages/workout-spa-editor/src/__regressions__/library-badge.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Badge/Badge.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Button/Button.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/ErrorMessage/ErrorMessage.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Icon/Icon.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Input/Input.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/ThemeToggle/ThemeToggle.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Toast/Toast.test.tsx",
  "packages/workout-spa-editor/src/components/atoms/Tooltip/Tooltip.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/BatchProcessingBanner/BatchMessage.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/BatchProcessingBanner/BatchProcessingBanner.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CalendarEmptyStates/CalendarEmptyStates.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CardShell/CardShell.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CardShell/contrast.test.ts",
  "packages/workout-spa-editor/src/components/molecules/CardShell/shared-visual-contract.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CardShell/status-tokens.test.ts",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityDialog.bootstrap.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingActivityDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/CoachingSyncButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/LinkedWorkoutSection.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/MatchToPicker.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-convert.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-dialog-actions.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CoachingCard/use-coaching-dialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ConfirmationModal/ConfirmationModal.accessibility.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ConfirmationModal/ConfirmationModal.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CreateRepetitionBlockButton/CreateRepetitionBlockButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/DensityToggle/DensityToggle.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/EmptyDayDialog/EmptyDayDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/EmptyWorkoutState/EmptyWorkoutState.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ExportFormatSelector/ExportFormatSelector.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/ExportFormatSelector/FormatDropdown.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/FileUpload/FileUpload.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/GarminPushButton/GarminPushButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/GarminPushButton/useGarminPush.test.ts",
  "packages/workout-spa-editor/src/components/molecules/MatchedSessionCard/MatchedSessionCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/PasteButton/PasteButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RawWorkoutDialog/RawWorkoutDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RawWorkoutDialog/raw-workout-hooks.test.ts",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.accessibility.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.integration.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.property.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockContextMenu.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RepetitionBlockCard/RepetitionBlockSteps.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RouteErrorBoundary.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/RouteErrorFallback.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/SaveButton/SaveButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/SaveButton/save-handler.analytics.test.ts",
  "packages/workout-spa-editor/src/components/molecules/SaveToLibraryButton/generate-thumbnail.test.ts",
  "packages/workout-spa-editor/src/components/molecules/SelectionIndicator/SelectionIndicator.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StepCard/CopyButton.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StepCard/StepCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StepNotesEditor/StepNotesEditor.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/StorageAvailabilityBanner/StorageAvailabilityBanner.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/SwimmingStepEditor/SwimmingStepEditor.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/TargetPicker/TargetPicker.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/TemplatePickerDialog/TemplatePickerDialog.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/UndoRedoButtons/UndoRedoButtons.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/WorkoutCard/WorkoutCard.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/WorkoutCard/workout-card-utils.test.ts",
  "packages/workout-spa-editor/src/components/molecules/WorkoutMetadataEditor/WorkoutMetadataEditor.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/WorkoutPreview/WorkoutPreview.test.tsx",
  "packages/workout-spa-editor/src/components/molecules/delete-button-styling.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/AiWorkoutInput.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/ZoneIndicator.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/useAiGeneration.analytics.test.ts",
  "packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/zones-formatter.test.ts",
  "packages/workout-spa-editor/src/components/organisms/AutoMatchBanner/AutoMatchBanner.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/BatchCostConfirmation/BatchCostConfirmation.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/EditorContextMenu/EditorContextMenuContent.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/OnboardingTutorial/OnboardingTutorial.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ProfileManager/ProfileManager.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ProfileManager/components/LinkedAccountsSection.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/BridgeStatusRow.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/SettingsPanel.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/UsageEmptyState.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/UsageTab.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/UsageTable.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/SettingsPanel/use-ai-tab-handlers.audit.test.ts",
  "packages/workout-spa-editor/src/components/organisms/StepEditor/FirstTimeHints.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/StepEditor/StepEditor.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.drag-integration.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.integration.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.multi-selection.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/WorkoutList.selection.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/WorkoutList/use-workout-list-dnd.test.ts",
  "packages/workout-spa-editor/src/components/organisms/WorkoutStats/WorkoutStats.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/SportZoneEditor.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/ZoneEditor.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/components/EditableZoneName.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/components/EditableZoneValue.test.tsx",
  "packages/workout-spa-editor/src/components/organisms/ZoneEditor/utils/parse-zone-field.test.ts",
  "packages/workout-spa-editor/src/components/organisms/ZonesConflictDialog/ZonesConflictDialog.test.tsx",
  "packages/workout-spa-editor/src/components/pages/CalendarHeader.test.tsx",
  "packages/workout-spa-editor/src/components/pages/CalendarPage.test.tsx",
  "packages/workout-spa-editor/src/components/pages/CalendarWeekGrid.test.tsx",
  "packages/workout-spa-editor/src/components/pages/EditorNewWorkout.analytics.test.tsx",
  "packages/workout-spa-editor/src/components/pages/EditorPage.test.tsx",
  "packages/workout-spa-editor/src/components/pages/HelpSection/HelpSection.test.tsx",
  "packages/workout-spa-editor/src/components/pages/LibraryPage.test.tsx",
  "packages/workout-spa-editor/src/components/pages/ManualCreateSection.analytics.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutActions.property.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutActions.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutHeader.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutSection.focus-integration.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/WorkoutStepsListActions.test.tsx",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/use-delete-step-with-toast.test.ts",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/useWorkoutSectionHandlers.test.ts",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/useWorkoutSectionState.test.ts",
  "packages/workout-spa-editor/src/components/pages/WorkoutSection/workout-section-handlers-helpers.test.ts",
  "packages/workout-spa-editor/src/components/pages/batch-prepare.test.ts",
  "packages/workout-spa-editor/src/components/pages/calendar-utils.test.ts",
  "packages/workout-spa-editor/src/components/pages/save-as-template.test.ts",
  "packages/workout-spa-editor/src/components/pages/use-batch-runner.test.ts",
  "packages/workout-spa-editor/src/components/pages/use-batch-state.test.ts",
  "packages/workout-spa-editor/src/components/pages/use-editor-actions.test.ts",
  "packages/workout-spa-editor/src/components/templates/MainLayout/LayoutHeader.test.tsx",
  "packages/workout-spa-editor/src/components/templates/MainLayout/MainLayout.test.tsx",
  "packages/workout-spa-editor/src/components/templates/MainLayout/components/MobileMenuPanel.test.tsx",
  "packages/workout-spa-editor/src/contexts/ThemeContext.test.tsx",
  "packages/workout-spa-editor/src/contexts/analytics-context.test.tsx",
  "packages/workout-spa-editor/src/contexts/coaching-registry-bootstrap.test.tsx",
  "packages/workout-spa-editor/src/contexts/focus-registry-context.test.tsx",
  "packages/workout-spa-editor/src/contexts/garmin-bridge-context.test.tsx",
  "packages/workout-spa-editor/src/contexts/settings-dialog-context.test.tsx",
  "packages/workout-spa-editor/src/router-base.test.tsx",
  "packages/workout-spa-editor/src/routes.test.tsx",
  "packages/workout-spa-editor/src/types/auto-match-dismissal.test.ts",
  "packages/workout-spa-editor/src/types/bridge-schemas.test.ts",
  "packages/workout-spa-editor/src/types/calendar-schemas.test.ts",
  "packages/workout-spa-editor/src/types/coaching-account.test.ts",
  "packages/workout-spa-editor/src/types/coaching-activity-record.test.ts",
  "packages/workout-spa-editor/src/types/errors.test.ts",
  "packages/workout-spa-editor/src/types/krd-guards.test.ts",
  "packages/workout-spa-editor/src/types/krd.test.ts",
  "packages/workout-spa-editor/src/types/schemas/repetition-block-id.test.ts",
  "packages/workout-spa-editor/src/types/session-match-errors.test.ts",
  "packages/workout-spa-editor/src/types/session-match.test.ts",
  "packages/workout-spa-editor/src/types/ui-workout.test.ts",
  "packages/workout-spa-editor/src/types/usage-schemas.test.ts",
  "packages/workout-spa-editor/src/types/user-preferences.test.ts",
  "packages/workout-spa-editor/src/types/validation.test.ts",
  "packages/workout-spa-editor/src/types/validation/helpers.test.ts",
  "packages/workout-spa-editor/src/utils/build-keyboard-handlers.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-hr-zones.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-pace-zones.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-power-zones.test.ts",
  "packages/workout-spa-editor/src/utils/calculate-zone-values.test.ts",
  "packages/workout-spa-editor/src/utils/export-workout.test.ts",
  "packages/workout-spa-editor/src/utils/format-relative-time.test.ts",
  "packages/workout-spa-editor/src/utils/format-week-label.test.ts",
  "packages/workout-spa-editor/src/utils/id-generation.test.ts",
  "packages/workout-spa-editor/src/utils/import-workout.test.ts",
  "packages/workout-spa-editor/src/utils/json-parser.test.ts",
  "packages/workout-spa-editor/src/utils/krd-validator.test.ts",
  "packages/workout-spa-editor/src/utils/library-storage.test.ts",
  "packages/workout-spa-editor/src/utils/no-browser-alerts.test.ts",
  "packages/workout-spa-editor/src/utils/profile-storage.test.ts",
  "packages/workout-spa-editor/src/utils/week-utils.test.ts",
  "packages/workout-spa-editor/src/utils/workout-stats.test.ts",
]);

export function __setAllowlistsForTest({
  BACKEND,
  SPA_NON_COMPONENT,
  SPA_COMPONENT,
}) {
  AAA_ALLOWLIST_BACKEND = BACKEND;
  AAA_ALLOWLIST_SPA_NON_COMPONENT = SPA_NON_COMPONENT;
  AAA_ALLOWLIST_SPA_COMPONENT = SPA_COMPONENT;
}

const EXCLUDED_FRAGMENTS = [
  "/node_modules/",
  "/dist/",
  "/coverage/",
  "/test-utils/",
  "/e2e/",
  "/.storybook/",
];
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

function isInScope(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (EXCLUDED_FRAGMENTS.some((frag) => p.includes(frag))) return false;
  if (p.startsWith("node_modules/")) return false;
  if (p.startsWith("dist/")) return false;
  if (p.startsWith("coverage/")) return false;
  if (p.endsWith(".stories.ts") || p.endsWith(".stories.tsx")) return false;
  const base = p.split("/").pop();
  if (EXCLUDED_BASENAMES.has(base)) return false;
  if (!p.endsWith(".test.ts") && !p.endsWith(".test.tsx")) return false;
  return true;
}

const SPA_NON_COMPONENT_PREFIXES = [
  "packages/workout-spa-editor/src/application/",
  "packages/workout-spa-editor/src/adapters/",
  "packages/workout-spa-editor/src/store/",
  "packages/workout-spa-editor/src/hooks/",
  "packages/workout-spa-editor/src/lib/",
];
const SPA_COMPONENT_PREFIXES = [
  "packages/workout-spa-editor/src/components/",
  "packages/workout-spa-editor/src/pages/",
];

export function inferShard(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (p.startsWith("packages/workout-spa-editor/")) {
    if (SPA_NON_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_NON_COMPONENT";
    if (SPA_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_COMPONENT";
    return "SPA_COMPONENT";
  }
  return "BACKEND";
}

// Shared `it`-call detector — kept in sync with the title-rule guards.
import { IT_CALL_RE } from "./it-title-extractor.mjs";

const ARRANGE_RE = /^\s*\/\/\s+Arrange\s*$/gm;
const ACT_RE = /^\s*\/\/\s+Act\s*$/gm;
const ASSERT_RE = /^\s*\/\/\s+Assert\s*$/gm;

export function hasCanonicalMarkers(source) {
  const itCount = (source.match(IT_CALL_RE) || []).length;
  if (itCount === 0) return true;
  const arrangeCount = (source.match(ARRANGE_RE) || []).length;
  if (arrangeCount < itCount) return false;
  const actCount = (source.match(ACT_RE) || []).length;
  if (actCount < itCount) return false;
  const assertCount = (source.match(ASSERT_RE) || []).length;
  if (assertCount < itCount) return false;
  return true;
}

function isAllowlisted(repoRelPath) {
  return (
    AAA_ALLOWLIST_BACKEND.has(repoRelPath) ||
    AAA_ALLOWLIST_SPA_NON_COMPONENT.has(repoRelPath) ||
    AAA_ALLOWLIST_SPA_COMPONENT.has(repoRelPath)
  );
}

function findFiles({ packagesDir = PACKAGES_DIR } = {}) {
  const files = [];
  if (!existsSync(packagesDir)) return files;
  walk(packagesDir, files);
  return files;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(REPO_ROOT, full).replaceAll("\\", "/");
    if (EXCLUDED_FRAGMENTS.some((frag) => rel.includes(frag))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isInScope(rel)) continue;
    out.push(full);
  }
}

export function collectAaaViolations({
  packagesDir = PACKAGES_DIR,
  repoRoot = REPO_ROOT,
  files,
} = {}) {
  const targetFiles = files !== undefined ? files : findFiles({ packagesDir });
  const violations = [];
  for (const file of targetFiles) {
    const rel = relative(repoRoot, file).replaceAll("\\", "/");
    if (!isInScope(rel)) continue;
    if (isAllowlisted(rel)) continue;
    const source = readFileSync(file, "utf8");
    if (!hasCanonicalMarkers(source)) {
      violations.push({ path: rel, shard: inferShard(rel) });
    }
  }
  return { violations };
}

function gitChangedTestFiles() {
  try {
    const out = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    ).trim();
    if (!out) return [];
    return out
      .split(/\n/)
      .filter((p) => isInScope(p))
      .map((p) => resolve(REPO_ROOT, p));
  } catch {
    return [];
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changedFilesMode = process.argv.includes("--changed-files");
  const opts = changedFilesMode ? { files: gitChangedTestFiles() } : {};
  if (changedFilesMode && opts.files.length === 0) {
    process.exit(0);
  }
  const { violations } = collectAaaViolations(opts);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(
        `R-ItBodyAAA: ${v.path} — file is missing AAA markers (or markers out of order); see openspec/specs/test-conventions/spec.md for the canonical form.`
      );
    }
    console.error(
      `\n${violations.length} AAA violation(s). Each it() body MUST contain canonical Pascal-case // Arrange, // Act, // Assert line comments.`
    );
    process.exit(1);
  }
  if (!changedFilesMode) {
    console.log(
      `[check-test-aaa] all in-scope test files contain canonical AAA markers.`
    );
  }
}
