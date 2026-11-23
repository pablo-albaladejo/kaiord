/**
 * What counts as English copy typed into the source, shared by the two
 * i18n rules (`local/no-jsx-literal-text`, `local/no-literal-copy`).
 *
 * `copyStrings(node, resolve)` returns every string an expression can
 * evaluate to that a person would read: a string literal, the static parts
 * of a template literal or of a `+` concatenation (`"Step " + n`), and both
 * branches of a conditional or a logical expression (`open ? "Hide" :
 * "Show"`, `name || "Untitled"`), however deeply nested. An identifier or a
 * call yields what `resolve` finds for it (see `copy-resolve.mjs`), else
 * nothing; `t("…")` yields nothing.
 */

const LETTER = /\p{L}/u;

/** A dictionary key such as `toast.saved` or `pageHeader.newTitle`. */
const KEY_SHAPE = /^[a-z][\w-]*(\.[\w-]+)+$/;

const WRAPPERS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
]);

const concatLeaves = (node) =>
  node.type === "BinaryExpression" && node.operator === "+"
    ? [...concatLeaves(node.left), ...concatLeaves(node.right)]
    : [node];

const isStringLiteral = (node) =>
  node.type === "Literal" && typeof node.value === "string";

const concatStrings = (node, resolve) => {
  const leaves = concatLeaves(node);
  const literals = leaves.filter(isStringLiteral).map((leaf) => leaf.value);
  const nested = leaves
    .filter((leaf) => !isStringLiteral(leaf))
    .flatMap((leaf) => copyStrings(leaf, resolve));
  return literals.length ? [literals.join(" "), ...nested] : nested;
};

export const copyStrings = (node, resolve = () => []) => {
  if (!node) return [];
  if (WRAPPERS.has(node.type)) return copyStrings(node.expression, resolve);
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? [node.value] : [];
    case "TemplateLiteral":
      return [node.quasis.map((q) => q.value.cooked ?? "").join(" ")];
    case "ConditionalExpression":
      return [
        ...copyStrings(node.consequent, resolve),
        ...copyStrings(node.alternate, resolve),
      ];
    case "LogicalExpression":
      return [
        ...copyStrings(node.left, resolve),
        ...copyStrings(node.right, resolve),
      ];
    case "BinaryExpression":
      return node.operator === "+" ? concatStrings(node, resolve) : [];
    case "Identifier":
    case "CallExpression":
      return resolve(node);
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

/** Copy shaped like a sentence or a name: a space or a capital first. */
export const isProse = (text) => /\s/.test(text) || /^\p{Lu}/u.test(text);

export const ALLOW_SCHEMA = [
  {
    type: "object",
    properties: { allow: { type: "array", items: { type: "string" } } },
    additionalProperties: false,
  },
];
