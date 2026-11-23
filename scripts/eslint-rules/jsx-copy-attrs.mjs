/**
 * Which JSX attributes carry copy, for `local/no-jsx-literal-text`: an
 * accessible-name or hint attribute on any element, a copy prop on a
 * component (where the component renders it as text), and the `value` of a
 * button-like `<input>` (`<input type="submit" value="Send" />`), which the
 * browser draws as the button's label.
 */

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
  "text",
  "tooltip",
]);

/** `confirmLabel`, `emptyText`, `actionLabel`, `emptyMessage`, … */
const COMPOUND_COPY_PROP =
  /^[a-z]\w*(?:Label|Text|Title|Message|Description|Hint|Tooltip|Heading)$/;

const BUTTON_INPUT_TYPES = new Set(["submit", "button", "reset"]);

const isComponent = (name) => {
  if (name.type === "JSXMemberExpression") return true;
  return name.type === "JSXIdentifier" && /^[A-Z]/.test(name.name);
};

const literalAttribute = (element, name) => {
  const attr = element.attributes.find(
    (a) => a.type === "JSXAttribute" && a.name.name === name
  );
  return attr?.value?.type === "Literal" ? attr.value.value : undefined;
};

const isButtonInputValue = (element) =>
  element.name.type === "JSXIdentifier" &&
  element.name.name === "input" &&
  BUTTON_INPUT_TYPES.has(literalAttribute(element, "type"));

/** Whether `node` (a `JSXAttribute` with a plain name) holds copy. */
export const isCopyAttribute = (node) => {
  const prop = node.name.name;
  const element = node.parent;
  if (COPY_ATTRS.has(prop)) return true;
  if (prop === "value") return isButtonInputValue(element);
  if (!isComponent(element.name)) return false;
  return COMPONENT_COPY_PROPS.has(prop) || COMPOUND_COPY_PROP.test(prop);
};
