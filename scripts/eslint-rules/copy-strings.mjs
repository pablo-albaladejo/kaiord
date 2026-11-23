/**
 * What counts as English copy typed into the source, shared by the two
 * i18n rules (`local/no-jsx-literal-text`, `local/no-literal-copy`).
 *
 * `copyStrings(node)` returns every string an expression can evaluate to
 * that a person would read: a string literal, the static parts of a
 * template literal, and both branches of a conditional or a logical
 * expression (`open ? "Hide" : "Show"`, `name || "Untitled"`), however
 * deeply nested. A call (`t("…")`) or an identifier yields nothing.
 */

const LETTER = /\p{L}/u;

/** A dictionary key such as `toast.saved` or `pageHeader.newTitle`. */
const KEY_SHAPE = /^[a-z][\w-]*(\.[\w-]+)+$/;

export const copyStrings = (node) => {
  if (!node) return [];
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? [node.value] : [];
    case "TemplateLiteral":
      return [node.quasis.map((q) => q.value.cooked ?? "").join(" ")];
    case "ConditionalExpression":
      return [...copyStrings(node.consequent), ...copyStrings(node.alternate)];
    case "LogicalExpression":
      return [...copyStrings(node.left), ...copyStrings(node.right)];
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
      return copyStrings(node.expression);
    default:
      return [];
  }
};

/**
 * The trimmed text when `raw` is copy a person reads, else null: it has a
 * letter, it is not a dictionary key, and it is not on the allow list.
 */
export const copyText = (raw, allow) => {
  const text = raw?.trim();
  if (!text || !LETTER.test(text) || allow.has(text)) return null;
  if (KEY_SHAPE.test(text)) return null;
  return text;
};

export const ALLOW_SCHEMA = [
  {
    type: "object",
    properties: { allow: { type: "array", items: { type: "string" } } },
    additionalProperties: false,
  },
];
