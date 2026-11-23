/**
 * Local ESLint rule — no-literal-copy.
 *
 * The non-JSX half of the i18n guard (`no-jsx-literal-text` is the JSX
 * half). Copy built outside JSX reaches the athlete through these shapes,
 * and all of them must come from the translator:
 *
 * - a toast: `toast(…)` and the title and the description of
 *   `toast.error(…)`, `toasts.info(…)`, `useToastContext().success(…)`;
 * - a state setter for copy (`setError`, `setMessage`, `setNotice`,
 *   `setWarning`, …), and a status setter (`setStatus`) handed prose;
 * - a copy property of an object literal (`label`, `title`, `text`, …)
 *   that a component later renders (`{ value: "drill", label: "Drill" }`);
 * - every value of a label map (`SPORT_LABELS`, `KIND_LABEL`, `ERROR_COPY`)
 *   and the prose of a names map (`SPORT_NAMES`).
 *
 * Each is read in place, through `+`, through a `const` that holds the
 * string and through a local function that returns it. A dictionary key
 * (`stroke.freestyle`), text without a letter and the `allow` list are not
 * copy. Types are not values and are not checked.
 */

import { resolverFor } from "./copy-resolve.mjs";
import { COPY_KEYS, keyName, labelMapOf, setterKind } from "./copy-shapes.mjs";
import {
  ALLOW_SCHEMA,
  copyStrings,
  copyText,
  isProse,
} from "./copy-strings.mjs";
import { isToastCall } from "./toast-call.mjs";

const noLiteralCopy = {
  meta: {
    type: "problem",
    schema: ALLOW_SCHEMA,
    messages: {
      literal:
        'Literal UI copy "{{text}}". Translate it with t("…") and add ' +
        "the key to the en and es locale files.",
    },
  },
  create(context) {
    const allow = new Set(context.options[0]?.allow ?? []);
    const resolve = resolverFor(context);
    const check = (node, kind = "copy") => {
      for (const raw of copyStrings(node, resolve)) {
        const text = copyText(raw, allow);
        if (text && (kind === "copy" || isProse(text)))
          context.report({ node, messageId: "literal", data: { text } });
      }
    };
    return {
      CallExpression(node) {
        const kind = setterKind(node);
        if (kind) {
          if (node.arguments[0]) check(node.arguments[0], kind);
          return;
        }
        if (!isToastCall(context, node)) return;
        for (const arg of node.arguments.slice(0, 2)) check(arg);
      },
      VariableDeclarator(node) {
        const found = labelMapOf(node);
        if (!found) return;
        for (const property of found.map.properties)
          if (property.type === "Property" && !COPY_KEYS.has(keyName(property)))
            check(property.value, found.kind);
      },
      Property(node) {
        if (node.parent.type !== "ObjectExpression" || node.computed) return;
        if (!COPY_KEYS.has(keyName(node))) return;
        check(node.value);
      },
    };
  },
};

export default noLiteralCopy;
