/**
 * Every place the App holds work a reload would lose reports it to the one
 * registry (`lib/unsaved-edits.ts`), so neither a silent update nor the
 * update prompt's Reload discards it (design D4).
 *
 * The guard finds that work by its shape in the source: a Zustand store, a
 * draft in React state, a workout or a pending answer held in state, a file
 * input (an import starts there), and a flag for work in flight. A file
 * found that way passes when it reports itself (`useUnsavedWork(` or
 * `armUnsavedEdits(`), when the file named in `REPORTED_BY` reports for it,
 * or when `HOLDS_NOTHING_TO_LOSE` says why a reload loses nothing. Typing
 * into any dialog is counted at run time by `unsaved-dialog-input.ts`, so a
 * dialog's own form needs no entry beyond naming that reason.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "..");

const SHAPES: ReadonlyArray<readonly [string, RegExp]> = [
  ["a Zustand store", /from "zustand"[\s\S]*\bcreate(<[^>]*>)?\(/],
  ["a draft", /\[\s*\w*[dD]raft\w*\s*,\s*set\w*\s*\]\s*=\s*useState/],
  [
    "a workout or a pending answer",
    /useState<[^>]*\b(\w*Draft\w*|\w*Pending\w*|KRD|UIWorkout)\b/,
  ],
  ["a form", /useState<\w*(Input|Fields)>/],
  ["a file input", /type="file"/],
  [
    "work in flight",
    /\[\s*(is(Loading|Running|Processing)|busy)\s*,\s*set\w*\s*\]\s*=\s*useState/,
  ],
];

const REPORTS = /\b(useUnsavedWork|armUnsavedEdits)\(/;

/** Found files whose work another file reports. */
const REPORTED_BY: Record<string, string> = {
  // The editor's draft: a scheduled workout's edits, or a new workout.
  "store/workout-store.ts": "components/pages/use-editor-page.ts",
  "components/pages/use-workout-record.ts":
    "components/pages/use-editor-save.ts",
  "components/molecules/FileUpload/FileUploadInput.tsx":
    "components/molecules/FileUpload/useFileUpload.ts",
  "components/molecules/FileUpload/use-file-upload-state.ts":
    "components/molecules/FileUpload/useFileUpload.ts",
  "components/organisms/SettingsPanel/BackupImportSection.tsx":
    "components/organisms/SettingsPanel/use-import-backup.ts",
  "components/pages/health/labs/LabImportSection.tsx":
    "components/pages/health/labs/use-lab-import.ts",
};

const IN_A_DIALOG =
  "typed inside a dialog, which unsaved-dialog-input.ts counts until it closes";
const COMMITS_ON_BLUR =
  "commits on blur: a click on Reload blurs it first, and nothing is typed without the input that closes the silent path";

/** Found files that hold nothing a reload would lose, and why. */
const HOLDS_NOTHING_TO_LOSE: Record<string, string> = {
  "store/ai-runtime-store.ts":
    "the providers' runtime state, read again from the database at boot",
  "store/train2go-store.ts":
    "the extension's session state, derived again on every boot",
  "hooks/use-chat-conversation-nav.ts":
    "the id of a conversation not created yet; nothing typed is kept there",
  "components/organisms/Chat/ConversationTitleInput.tsx": COMMITS_ON_BLUR,
  "components/organisms/ZoneEditor/components/EditableZoneName.tsx":
    COMMITS_ON_BLUR,
  "components/organisms/ZoneEditor/components/EditableZoneValue.tsx":
    COMMITS_ON_BLUR,
  "components/organisms/SettingsPanel/CustomInstructions.tsx":
    "autosaved: its pending save is in pending-flushes, which the update awaits",
  "components/pages/ConvertPage/ConvertFlow.tsx":
    "a converted copy of a file still on the athlete's disk, never edited; its import in flight is FileUpload's",
  "components/pages/AthletesPage/AthleteFileActions.tsx":
    "an athlete file is read and written in one call, within milliseconds of the pick or drop that already closed the silent path",
  "components/molecules/WellnessEntryDialog/use-wellness-fields.ts":
    IN_A_DIALOG,
  "components/molecules/GoalSetupDialog/GoalSetupForm.tsx": IN_A_DIALOG,
};

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const isSource = (path: string): boolean =>
  /\.(ts|tsx)$/.test(path) &&
  !/\.(test|spec|stories)\.tsx?$|\.d\.ts$/.test(path) &&
  !/(^|\/)(__\w+__|test-utils|test-fixtures)(\/|$)/.test(path);

const read = (path: string): string => readFileSync(join(SRC, path), "utf8");

const shapesOf = (source: string): string[] =>
  SHAPES.filter(([, shape]) => shape.test(stripComments(source))).map(
    ([name]) => name
  );

const found = (): Map<string, string[]> =>
  new Map(
    readdirSync(SRC, { recursive: true })
      .map((entry) => String(entry).split("\\").join("/"))
      .filter(isSource)
      .map((path) => [path, shapesOf(read(path))] as const)
      .filter(([, shapes]) => shapes.length > 0)
  );

const reports = (path: string): boolean =>
  REPORTS.test(stripComments(read(path)));

describe("unsaved work reporters", () => {
  it("should find a draft, a pending answer, a file input and work in flight by their shape", () => {
    // Arrange
    const draft = `const [draft, setDraft] = useState("");`;
    const pending = `useState<PendingAction | null>(null)`;
    const upload = `<input type="file" />`;
    const flight = `const [busy, setBusy] = useState(false);`;
    const commented = `// const [draft, setDraft] = useState("");`;

    // Act
    const shapes = [draft, pending, upload, flight, commented].map(shapesOf);

    // Assert
    expect(shapes).toEqual([
      ["a draft"],
      ["a workout or a pending answer"],
      ["a file input"],
      ["work in flight"],
      [],
    ]);
  });

  it("should have every found file report its work, have it reported, or say why it holds nothing to lose", () => {
    // Arrange
    const files = found();

    // Act
    const unreported = [...files]
      .filter(([path]) => !reports(path))
      .filter(([path]) => !REPORTED_BY[path] || !reports(REPORTED_BY[path]))
      .filter(([path]) => !HOLDS_NOTHING_TO_LOSE[path])
      .map(([path, shapes]) => `${path} (${shapes.join(", ")})`);

    // Assert
    expect(unreported).toEqual([]);
  });

  it("should list only files the scan still finds, so no entry outlives its work", () => {
    // Arrange
    const files = found();

    // Act
    const stale = [
      ...Object.keys(REPORTED_BY),
      ...Object.keys(HOLDS_NOTHING_TO_LOSE),
    ].filter((path) => !files.has(path));

    // Assert
    expect(stale).toEqual([]);
  });

  it("should not excuse a file that reports its work itself", () => {
    // Arrange
    const files = found();

    // Act
    const excusedButReporting = Object.keys(HOLDS_NOTHING_TO_LOSE).filter(
      (path) => files.has(path) && reports(path)
    );

    // Assert
    expect(excusedButReporting).toEqual([]);
  });
});
