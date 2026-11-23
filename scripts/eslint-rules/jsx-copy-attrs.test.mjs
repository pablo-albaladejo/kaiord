import assert from "node:assert/strict";
import { test } from "node:test";

import { isCopyAttribute } from "./jsx-copy-attrs.mjs";

const attribute = (element, name, value) => ({
  type: "JSXAttribute",
  name: { type: "JSXIdentifier", name },
  value: value === undefined ? null : { type: "Literal", value },
});

const attributeOn = (tag, name, siblings = {}) => {
  const element = {
    name: { type: "JSXIdentifier", name: tag },
    attributes: [],
  };
  for (const [key, value] of Object.entries(siblings))
    element.attributes.push(attribute(element, key, value));
  const node = { ...attribute(element, name, "x"), parent: element };
  element.attributes.push(node);
  return node;
};

test("should treat a component's copy props as copy and leave other props alone", () => {
  // Arrange
  const props = [
    "text",
    "tooltip",
    "emptyText",
    "actionLabel",
    "submitLabel",
    "textColor",
    "variant",
  ];

  // Act
  const copy = props.map((prop) => isCopyAttribute(attributeOn("Chip", prop)));

  // Assert
  assert.deepEqual(copy, [true, true, true, true, true, false, false]);
  assert.equal(isCopyAttribute(attributeOn("div", "tooltip")), false);
  assert.equal(isCopyAttribute(attributeOn("div", "aria-label")), true);
});

test("should treat a button-like input's value as its label", () => {
  // Arrange
  const submit = attributeOn("input", "value", { type: "submit" });
  const reset = attributeOn("input", "value", { type: "reset" });
  const text = attributeOn("input", "value", { type: "text" });
  const option = attributeOn("option", "value");

  // Act
  const copy = [submit, reset, text, option].map(isCopyAttribute);

  // Assert
  assert.deepEqual(copy, [true, true, false, false]);
});
