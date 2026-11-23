/**
 * The non-JSX shapes that carry copy to the athlete, for
 * `local/no-literal-copy`: the copy keys of an object literal, the state
 * setters whose value a component renders, and the label maps.
 */

export const COPY_KEYS = new Set([
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
  "text",
  "emptyText",
  "tooltip",
]);

/** `setError`, `setMessage`, `setNotice`, `setSaveWarning`, … */
const COPY_SETTER =
  /^set(?:[A-Z]\w*)?(?:Error|Message|Notice|Warning|Hint|Text|Label|Title|Description)$/;

/** `setStatus`, `setSyncStatus`: a discriminant (`"loading"`) or copy. */
const STATUS_SETTER = /^set(?:[A-Z]\w*)?Status$/;

/** "copy" for a copy setter, "prose" for a status setter, else null. */
export const setterKind = ({ callee }) => {
  if (callee.type !== "Identifier") return null;
  if (COPY_SETTER.test(callee.name)) return "copy";
  return STATUS_SETTER.test(callee.name) ? "prose" : null;
};

const LABEL_MAP = /(?:LABELS?|_COPY|Labels?|Copy)$/;

/** `SPORT_NAMES` may map to identifiers (`ftp`); only prose is copy. */
const NAME_MAP = /(?:NAMES?|Names?)$/;

const WRAPPERS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
]);

/**
 * The object literal a label-map `const` is initialised with and which of
 * its strings are copy ("copy": every one, "prose": names), if any.
 */
export const labelMapOf = (declarator) => {
  if (declarator.id.type !== "Identifier") return null;
  const { name } = declarator.id;
  const kind = LABEL_MAP.test(name) ? "copy" : NAME_MAP.test(name) && "prose";
  if (!kind) return null;
  let init = declarator.init;
  while (init && WRAPPERS.has(init.type)) init = init.expression;
  return init?.type === "ObjectExpression" ? { map: init, kind } : null;
};

export const keyName = (property) =>
  property.key.type === "Identifier" ? property.key.name : property.key.value;
