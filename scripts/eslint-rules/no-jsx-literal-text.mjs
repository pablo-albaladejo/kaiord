/**
 * Local ESLint rule — no-jsx-literal-text.
 *
 * User-facing copy in JSX must come from the translator (`t(...)`), so the
 * Spanish UI never shows a string someone typed in English. The rule reports:
 *
 * - JSX text containing a letter (`<p>Today</p>`);
 * - a string literal rendered as a child (`<p>{"Today"}</p>`);
 * - a string literal in a copy attribute (`aria-label`, `title`,
 *   `placeholder`, `alt`, `aria-description`, `aria-roledescription`),
 *   bare or wrapped in an expression container;
 * - a string literal in a component's copy prop (`label`, `description`,
 *   `title`, `heading`) on a capitalized element (`<Input label="…" />`,
 *   `<Ui.Dialog title="…" />`), where the component renders it as text.
 *
 * Text without a letter (`·`, `+`, `—`, `42`) is not copy. Proper nouns that
 * stay in every language are passed in the `allow` option.
 */

const COPY_ATTRS = new Set([
  "aria-label",
  "aria-description",
  "aria-roledescription",
  "title",
  "placeholder",
  "alt",
]);
const COMPONENT_COPY_PROPS = new Set([
  "label",
  "description",
  "title",
  "heading",
]);
const LETTER = /\p{L}/u;

const isComponent = (name) => {
  if (name.type === "JSXMemberExpression") return true;
  return name.type === "JSXIdentifier" && /^[A-Z]/.test(name.name);
};

const isCopyAttribute = (node) => {
  const prop = node.name.name;
  if (COPY_ATTRS.has(prop)) return true;
  return COMPONENT_COPY_PROPS.has(prop) && isComponent(node.parent.name);
};

const stringOf = (node) => {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string")
    return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis[0].value.cooked;
  return null;
};

const noJsxLiteralText = {
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: { allow: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: {
      literal:
        'Literal UI copy "{{text}}" in JSX. Translate it with t("…") ' +
        "and add the key to the en and es locale files.",
    },
  },
  create(context) {
    const allow = new Set(context.options[0]?.allow ?? []);
    const check = (node, raw) => {
      const text = raw?.trim();
      if (!text || !LETTER.test(text) || allow.has(text)) return;
      context.report({ node, messageId: "literal", data: { text } });
    };
    return {
      JSXText(node) {
        check(node, node.value);
      },
      JSXExpressionContainer(node) {
        const parent = node.parent?.type;
        if (parent === "JSXElement" || parent === "JSXFragment")
          check(node, stringOf(node.expression));
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (!isCopyAttribute(node)) return;
        const value =
          node.value?.type === "JSXExpressionContainer"
            ? node.value.expression
            : node.value;
        check(node, stringOf(value));
      },
    };
  },
};

export default noJsxLiteralText;
