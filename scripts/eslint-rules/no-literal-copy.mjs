/**
 * Local ESLint rule — no-literal-copy.
 *
 * The non-JSX half of the i18n guard (`no-jsx-literal-text` is the JSX
 * half). Copy built outside JSX reaches the athlete through these shapes,
 * and all of them must come from the translator:
 *
 * - a toast: the title and the description of `toast.error(…)`,
 *   `toasts.info(…)`, `useToastContext().success(…)`, either written in
 *   place or through a `const` that holds the string;
 * - a state setter for an error or a message (`setError("…")`,
 *   `setMessage(…)`, `setLastError(…)`), whose value a component renders;
 * - a copy property of an object literal (`label`, `title`, `message`, …)
 *   that a component later renders (`{ value: "drill", label: "Drill" }`);
 * - every value of a label map, a `const` named like one (`SPORT_LABELS`,
 *   `KIND_LABEL`, `statusLabels`, `ERROR_COPY`).
 *
 * A dictionary key (`stroke.freestyle`), text without a letter and the
 * `allow` list are not copy. Types are not values and are not checked.
 */

import { ALLOW_SCHEMA, copyStrings, copyText } from "./copy-strings.mjs";
import { constStrings, isToastCall } from "./toast-call.mjs";

const COPY_KEYS = new Set([
  "label",
  "title",
  "description",
  "heading",
  "message",
  "subtitle",
  "hint",
  "placeholder",
  "ariaLabel",
  "confirmLabel",
  "cancelLabel",
  "actionLabel",
]);

/** `setError`, `setMessage`, `setLastError`, `setSaveError`, … */
const COPY_SETTER = /^set(?:[A-Z]\w*)?(?:Error|Message)$/;

const isCopySetter = ({ callee }) =>
  callee.type === "Identifier" && COPY_SETTER.test(callee.name);

const LABEL_MAP = /(?:LABELS?|_COPY|Labels?|Copy)$/;

const WRAPPERS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
]);

/** The object literal a label-map `const` is initialised with, if any. */
const labelMapOf = (declarator) => {
  if (declarator.id.type !== "Identifier") return null;
  if (!LABEL_MAP.test(declarator.id.name)) return null;
  let init = declarator.init;
  while (init && WRAPPERS.has(init.type)) init = init.expression;
  return init?.type === "ObjectExpression" ? init : null;
};

const keyName = (property) =>
  property.key.type === "Identifier" ? property.key.name : property.key.value;

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
    const check = (node, strings) => {
      for (const raw of strings) {
        const text = copyText(raw, allow);
        if (text)
          context.report({ node, messageId: "literal", data: { text } });
      }
    };
    return {
      CallExpression(node) {
        if (isCopySetter(node)) {
          const [arg] = node.arguments;
          if (arg) check(arg, copyStrings(arg));
          return;
        }
        if (!isToastCall(context, node)) return;
        for (const arg of node.arguments.slice(0, 2))
          check(arg, [...copyStrings(arg), ...constStrings(context, arg)]);
      },
      VariableDeclarator(node) {
        const map = labelMapOf(node);
        if (!map) return;
        for (const property of map.properties)
          if (property.type === "Property" && !COPY_KEYS.has(keyName(property)))
            check(property.value, copyStrings(property.value));
      },
      Property(node) {
        if (node.parent.type !== "ObjectExpression" || node.computed) return;
        if (!COPY_KEYS.has(keyName(node))) return;
        check(node.value, copyStrings(node.value));
      },
    };
  },
};

export default noLiteralCopy;
