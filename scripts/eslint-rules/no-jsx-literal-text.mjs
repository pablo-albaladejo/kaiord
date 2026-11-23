/**
 * Local ESLint rule — no-jsx-literal-text.
 *
 * User-facing copy in JSX must come from the translator (`t(...)`), so the
 * Spanish UI never shows a string someone typed in English. The rule reports:
 *
 * - JSX text containing a letter (`<p>Today</p>`);
 * - a string rendered as a child (`<p>{"Today"}</p>`), including the static
 *   part of a template and either branch of a conditional or a fallback
 *   (`{open ? "Hide" : "Show"}`, `{name || "Untitled"}`, `` {`${n} steps`} ``);
 * - the same in a copy attribute (`aria-label`, `title`, `placeholder`,
 *   `alt`, `aria-description`, `aria-roledescription`, `aria-valuetext`);
 * - the same in a component's copy prop (`label`, `description`, `title`,
 *   `heading`, `message`, `subtitle`, `hint`, `confirmLabel`, `cancelLabel`)
 *   on a capitalized element (`<Input label="…" />`, `<Ui.Dialog title="…" />`),
 *   where the component renders it as text.
 *
 * Text without a letter (`·`, `+`, `—`, `42`) and a dictionary key
 * (`pageHeader.newTitle`) are not copy. Proper nouns that stay in every
 * language are passed in the `allow` option.
 */

import { ALLOW_SCHEMA, copyStrings, copyText } from "./copy-strings.mjs";

const COPY_ATTRS = new Set([
  "aria-label",
  "aria-description",
  "aria-roledescription",
  "aria-valuetext",
  "title",
  "placeholder",
  "alt",
]);
const COMPONENT_COPY_PROPS = new Set([
  "label",
  "description",
  "title",
  "heading",
  "message",
  "subtitle",
  "hint",
  "confirmLabel",
  "cancelLabel",
]);

const isComponent = (name) => {
  if (name.type === "JSXMemberExpression") return true;
  return name.type === "JSXIdentifier" && /^[A-Z]/.test(name.name);
};

const isCopyAttribute = (node) => {
  const prop = node.name.name;
  if (COPY_ATTRS.has(prop)) return true;
  return COMPONENT_COPY_PROPS.has(prop) && isComponent(node.parent.name);
};

const noJsxLiteralText = {
  meta: {
    type: "problem",
    schema: ALLOW_SCHEMA,
    messages: {
      literal:
        'Literal UI copy "{{text}}" in JSX. Translate it with t("…") ' +
        "and add the key to the en and es locale files.",
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
      JSXText(node) {
        const text = node.value.trim();
        if (text && !allow.has(text) && /\p{L}/u.test(text))
          context.report({ node, messageId: "literal", data: { text } });
      },
      JSXExpressionContainer(node) {
        const parent = node.parent?.type;
        if (parent === "JSXElement" || parent === "JSXFragment")
          check(node, copyStrings(node.expression));
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (!isCopyAttribute(node)) return;
        const value =
          node.value?.type === "JSXExpressionContainer"
            ? node.value.expression
            : node.value;
        check(node, copyStrings(value));
      },
    };
  },
};

export default noJsxLiteralText;
