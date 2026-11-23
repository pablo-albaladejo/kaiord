import { RuleTester } from "eslint";
import tseslintParser from "@typescript-eslint/parser";
import { test } from "node:test";

import rule from "./no-jsx-literal-text.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslintParser,
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

test("should report literal UI copy in JSX and leave translated copy alone", () => {
  // Arrange
  const literal = [{ messageId: "literal" }];
  const cases = {
    valid: [
      { code: 'const a = <p>{t("calendar.today")}</p>;' },
      { code: 'const a = <button aria-label={t("nav.next")} />;' },
      { code: "const a = <span>·</span>;" },
      { code: "const a = <span> + 42 — </span>;" },
      { code: 'const a = <div className="text-sm" data-testid="day" />;' },
      { code: 'const a = <div className={"text-sm"} />;' },
      { code: 'const a = <img alt="" />;' },
      { code: "const a = <p>{label}</p>;" },
      {
        code: 'const a = <option label="kg" />;',
        options: [{ allow: ["kg"] }],
      },
      { code: 'const a = <input label="Weight" />;' },
      { code: 'const a = <Input label={t("weight")} heading={h} />;' },
      { code: 'const a = <Card variant="Outline" />;' },
      {
        code: "const a = <p>Garmin Connect</p>;",
        options: [{ allow: ["Garmin Connect"] }],
      },
    ],
    invalid: [
      { code: "const a = <p>Today</p>;", errors: literal },
      { code: 'const a = <p>{"Today"}</p>;', errors: literal },
      { code: "const a = <p>{`Today`}</p>;", errors: literal },
      { code: "const a = <>Nuevo entreno</>;", errors: literal },
      { code: 'const a = <button aria-label="Next week" />;', errors: literal },
      { code: 'const a = <button title={"Chat"} />;', errors: literal },
      { code: 'const a = <input placeholder="sk-..." />;', errors: literal },
      { code: 'const a = <img alt="Logo" />;', errors: literal },
      { code: 'const a = <Input label="Weight (kg)" />;', errors: literal },
      { code: 'const a = <Field description={"Resting"} />;', errors: literal },
      { code: 'const a = <Section heading="Profile" />;', errors: literal },
      { code: 'const a = <Ui.Dialog title="Edit" />;', errors: literal },
    ],
  };

  // Act + Assert
  ruleTester.run("no-jsx-literal-text", rule, cases);
});

test("should report copy hidden in conditionals, fallbacks and templates", () => {
  // Arrange
  const literal = [{ messageId: "literal" }];
  const cases = {
    valid: [
      { code: 'const a = <p>{open ? t("hide") : t("show")}</p>;' },
      { code: 'const a = <p>{name || t("untitled")}</p>;' },
      { code: "const a = <p>{`${hours}:${minutes}`}</p>;" },
      { code: 'const a = <p>{ok ? "·" : "—"}</p>;' },
      { code: 'const a = <Banner message={t("sync.failed")} />;' },
      { code: 'const a = <p>{t(open ? "a.hide" : "a.show")}</p>;' },
    ],
    invalid: [
      {
        code: 'const a = <p>{open ? "Hide" : "Detail"}</p>;',
        errors: [...literal, ...literal],
      },
      { code: 'const a = <p>{open && "Open"}</p>;', errors: literal },
      { code: 'const a = <p>{name || "Untitled"}</p>;', errors: literal },
      { code: 'const a = <p>{name ?? "Untitled"}</p>;', errors: literal },
      { code: "const a = <p>{`${count} steps`}</p>;", errors: literal },
      {
        code: 'const a = <button aria-label={open ? "Close" : t("open")} />;',
        errors: literal,
      },
      { code: "const a = <button title={`Edit ${name}`} />;", errors: literal },
      { code: 'const a = <Banner message="Sync failed" />;', errors: literal },
      {
        code: 'const a = <Dialog confirmLabel="Apply" cancelLabel="Cancel" />;',
        errors: [...literal, ...literal],
      },
      {
        code: 'const a = <div aria-valuetext="Half done" />;',
        errors: literal,
      },
    ],
  };

  // Act + Assert
  ruleTester.run("no-jsx-literal-text", rule, cases);
});

test("should report copy built with + or held in a const or a local function", () => {
  // Arrange
  const literal = [{ messageId: "literal" }];
  const cases = {
    valid: [
      { code: "const a = <p>{count + 1}</p>;" },
      { code: 'const a = <p>{t("a.b") + " · " + n}</p>;' },
      { code: 'const L = t("a.b"); const a = <p>{L}</p>;' },
      { code: 'const C = "text-sm"; const a = <p className={C} />;' },
      { code: "const f = () => `${m}:${s}`; const a = <p>{f()}</p>;" },
      { code: "const a = <p>{format(x)}</p>;" },
    ],
    invalid: [
      { code: 'const a = <p>{"Step " + n}</p>;', errors: literal },
      { code: 'const L = "Saved"; const a = <p>{L}</p>;', errors: literal },
      {
        code: 'const L = open ? "Hide" : "Show"; const a = <p>{L}</p>;',
        errors: [...literal, ...literal],
      },
      {
        code: 'const T = "Edit"; const a = <button title={T} />;',
        errors: literal,
      },
      {
        code: 'function label(s) { return s ? "On" : "Off"; } const a = <p>{label(x)}</p>;',
        errors: [...literal, ...literal],
      },
      {
        code: 'const label = () => "Connected"; const a = <p>{label()}</p>;',
        errors: literal,
      },
    ],
  };

  // Act + Assert
  ruleTester.run("no-jsx-literal-text", rule, cases);
});

test("should report text, tooltip and empty-text props and a submit input's value", () => {
  // Arrange
  const literal = [{ messageId: "literal" }];
  const cases = {
    valid: [
      { code: 'const a = <input type="text" value="Send" />;' },
      { code: 'const a = <input type="submit" value={t("a.send")} />;' },
      { code: 'const a = <option value="cycling" />;' },
      { code: 'const a = <Chip text={t("a.b")} tooltip={t("a.c")} />;' },
      { code: 'const a = <Badge textColor="Red" />;' },
    ],
    invalid: [
      {
        code: 'const a = <input type="submit" value="Send" />;',
        errors: literal,
      },
      {
        code: 'const a = <input type="button" value="Cancel" />;',
        errors: literal,
      },
      { code: 'const a = <Chip text="New" />;', errors: literal },
      { code: 'const a = <List emptyText="No workouts" />;', errors: literal },
      {
        code: 'const a = <Icon tooltip="Drag to reorder" />;',
        errors: literal,
      },
      {
        code: 'const a = <Banner actionLabel="Try again" />;',
        errors: literal,
      },
      { code: 'const a = <Field submitLabel="Save" />;', errors: literal },
    ],
  };

  // Act + Assert
  ruleTester.run("no-jsx-literal-text", rule, cases);
});
