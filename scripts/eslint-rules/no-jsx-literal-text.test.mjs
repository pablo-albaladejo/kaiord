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
      { code: 'const a = <option label="kg" />;', options: [{ allow: ["kg"] }] },
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
