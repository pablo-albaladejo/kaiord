import { RuleTester } from "eslint";
import tseslintParser from "@typescript-eslint/parser";
import { test } from "node:test";

import { resolverFor } from "./copy-resolve.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslintParser,
    parserOptions: { ecmaVersion: 2024, sourceType: "module" },
  },
});

/** Reports each string `resolverFor` finds behind `show(<arg>)`. */
const probe = {
  meta: { type: "problem", schema: [], messages: { found: "{{text}}" } },
  create(context) {
    const resolve = resolverFor(context);
    return {
      CallExpression(node) {
        if (node.callee.name !== "show") return;
        for (const text of resolve(node.arguments[0]))
          context.report({ node, messageId: "found", data: { text } });
      },
    };
  },
};

const found = (...texts) =>
  texts.map((text) => ({ messageId: "found", data: { text } }));

test("should follow a const and a local function to the string they hold", () => {
  // Arrange
  const cases = {
    valid: [
      { code: "let L = 'Saved'; show(L);" },
      { code: "import { L } from './copy'; show(L);" },
      { code: "const f = (x) => show(x);" },
      { code: "const f = () => () => 'Inner'; show(f());" },
      { code: "show(t('a.b'));" },
      { code: "const L = () => 'Saved'; show(L);" },
    ],
    invalid: [
      { code: "const L = 'Saved'; show(L);", errors: found("Saved") },
      {
        code: "const L = ok ? 'On' : 'Off'; show(L);",
        errors: found("On", "Off"),
      },
      {
        code: "const f = () => 'Connected'; show(f());",
        errors: found("Connected"),
      },
      {
        code: "function f(s) { if (s) return 'On'; const g = () => 'No'; return 'Off'; } show(f(x));",
        errors: found("On", "Off"),
      },
    ],
  };

  // Act + Assert
  ruleTester.run("copy-resolve", probe, cases);
});
