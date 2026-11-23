import { RuleTester } from "eslint";
import tseslintParser from "@typescript-eslint/parser";
import { test } from "node:test";

import rule from "./no-literal-copy.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslintParser,
    parserOptions: { ecmaVersion: 2024, sourceType: "module" },
  },
});

const literal = [{ messageId: "literal" }];

test("should report a toast that shows English typed into the source", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'toast.error(t("toast.saveFailed"));' },
      { code: 'toasts.info(t("toast.synced"), t("toast.syncedDesc"));' },
      { code: 'const T = "toast.saved"; toast.success(t(T));' },
      { code: "toast.error(message);" },
      { code: 'logger.error("Save failed");' },
      { code: 'toast.dismiss("toast-1");' },
      { code: 'const error = (m) => m; error("Save failed");' },
      {
        code: 'const { success } = useToastContext(); success(t("editor.copied"));',
      },
    ],
    invalid: [
      { code: 'toast.error("Save failed");', errors: literal },
      { code: 'toasts.warning(t("a.b"), "Try again later");', errors: literal },
      {
        code: 'const SAVE_FAILED = "Could not save"; toast.error(SAVE_FAILED);',
        errors: literal,
      },
      { code: 'useToastContext().info("Synced");', errors: literal },
      {
        code: 'ctx.toast.success(ok ? "Saved" : "Kept");',
        errors: [...literal, ...literal],
      },
      {
        code: 'const { success, error } = useToastContext(); success("Step copied");',
        errors: literal,
      },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});

test("should report English handed to a state setter for an error or a message", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'setError(t("block.minRepeat"));' },
      { code: "setError(null);" },
      { code: 'setStatus("loading");' },
      { code: "setLastError(result.error);" },
    ],
    invalid: [
      { code: 'setError("Repeat count must be at least 2");', errors: literal },
      {
        code: 'setMessage(ok ? "Saved" : "Failed");',
        errors: [...literal, ...literal],
      },
      { code: 'setLastError("Extension not found");', errors: literal },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});

test("should report English in a label map", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'const SPORT_LABELS = { cycling: "sport.cycling" };' },
      { code: 'const STATUS_TEXT = { connected: "text-ink-body" };' },
      {
        code: 'const FIELD_LABELS = { ftp: "FTP" };',
        options: [{ allow: ["FTP"] }],
      },
      { code: 'const UNITS = { ftp: "Watts" };' },
      { code: "const statusLabel = (s) => s;" },
      { code: 'const kindLabel = () => ({ hr: "HR" });' },
    ],
    invalid: [
      { code: 'const SPORT_LABEL = { cycling: "Cycling" };', errors: literal },
      {
        code: 'const KIND_LABELS = { hr: "HR Zones", pace: "Pace" } as const;',
        errors: [...literal, ...literal],
      },
      {
        code: 'export const statusLabels = { ok: "All good" };',
        errors: literal,
      },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});

test("should report a copy property that holds English instead of a key", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'const o = { value: "freestyle", label: "stroke.freestyle" };' },
      { code: 'const o = { label: "FIT" };', options: [{ allow: ["FIT"] }] },
      { code: 'const o = { title: t("dialog.title") };' },
      { code: 'const o = { className: "Text-sm", field: "metadata" };' },
      { code: 'const o = { label: "—" };' },
      { code: 'type O = { label: "Cycling" };' },
    ],
    invalid: [
      {
        code: 'const o = { value: "freestyle", label: "Freestyle" };',
        errors: literal,
      },
      {
        code: 'const o = { title: "Download Backup?", confirmLabel: "Download" };',
        errors: [...literal, ...literal],
      },
      {
        code: 'const r = { ok: false, message: "Workout has no steps" };',
        errors: literal,
      },
      {
        code: "const o = { description: `Failed to read ${name}` };",
        errors: literal,
      },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});

test("should report copy built with + and copy a local function or const returns", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'toast.error(t("a.b") + suffix);' },
      { code: "setError(prefix + count);" },
      { code: 'const key = () => "toast.saved"; toast.success(t(key()));' },
      {
        code: 'const o = { label: base + "-x" };',
        options: [{ allow: ["-x"] }],
      },
    ],
    invalid: [
      { code: 'toast.error("Step " + n + " failed");', errors: literal },
      { code: 'setMessage("Saved " + name);', errors: literal },
      {
        code: 'const text = () => "Could not save"; toast.error(text());',
        errors: literal,
      },
      {
        code: 'function why() { if (a) return "Offline"; return t("x.y"); } setError(why());',
        errors: literal,
      },
      { code: 'const o = { label: "Week " + n };', errors: literal },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});

test("should report a bare toast call and the notice, warning and status setters", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'toast({ title: t("toast.saved") });' },
      { code: 'setStatus("loading");' },
      { code: 'setStatus("not-answering");' },
      { code: "setNotice(null);" },
      { code: 'setWarning(t("sync.stale"));' },
    ],
    invalid: [
      { code: 'toast("Saved");', errors: literal },
      { code: 'toast({ title: "Saved" });', errors: literal },
      { code: 'setNotice("Garmin is not answering");', errors: literal },
      { code: 'setWarning("Check your zones");', errors: literal },
      { code: 'setStatus("Sending to Garmin");', errors: literal },
      { code: 'setSyncStatus("Done");', errors: literal },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});

test("should report English in a names map and in text, tooltip and empty-text properties", () => {
  // Arrange
  const cases = {
    valid: [
      { code: 'const SPORT_NAMES = { cycling: "sport.cycling" };' },
      { code: 'const FIELD_NAMES = { ftp: "ftp", hr: "max_hr" };' },
      { code: 'const o = { tooltip: t("a.b"), emptyText: t("a.c") };' },
    ],
    invalid: [
      { code: 'const SPORT_NAMES = { cycling: "Cycling" };', errors: literal },
      {
        code: 'const PROVIDER_NAMES = { a: "Road bike" };',
        errors: literal,
      },
      { code: 'const o = { tooltip: "Drag to reorder" };', errors: literal },
      { code: 'const o = { emptyText: "No workouts" };', errors: literal },
      { code: 'const o = { text: "Try again" };', errors: literal },
    ],
  };

  // Act + Assert
  ruleTester.run("no-literal-copy", rule, cases);
});
