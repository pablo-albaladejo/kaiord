import assert from "node:assert/strict";
import { test } from "node:test";

import { copyStrings, copyText, isProse } from "./copy-strings.mjs";

const lit = (value) => ({ type: "Literal", value });
const id = (name) => ({ type: "Identifier", name });
const plus = (left, right) => ({
  type: "BinaryExpression",
  operator: "+",
  left,
  right,
});

test("should join the static parts of a + concatenation into one string", () => {
  // Arrange
  const node = plus(plus(lit("Step "), id("n")), lit(" of"));

  // Act
  const strings = copyStrings(node);

  // Assert
  assert.deepEqual(strings, ["Step   of"]);
  assert.deepEqual(copyStrings(plus(id("a"), id("b"))), []);
  assert.deepEqual(
    copyStrings({ ...plus(lit("a"), lit("b")), operator: "-" }),
    []
  );
});

test("should hand an identifier or a call to the resolver", () => {
  // Arrange
  const resolve = (node) => [node.type];

  // Act
  const strings = [
    ...copyStrings(id("L"), resolve),
    ...copyStrings({ type: "CallExpression" }, resolve),
    ...copyStrings(id("L")),
  ];

  // Assert
  assert.deepEqual(strings, ["Identifier", "CallExpression"]);
});

test("should keep copy and drop keys, symbols and allowed words", () => {
  // Arrange
  const allow = new Set(["FIT"]);

  // Act
  const texts = [" Saved ", "toast.saved", "·", "FIT"].map((raw) =>
    copyText(raw, allow)
  );

  // Assert
  assert.deepEqual(texts, ["Saved", null, null, null]);
  assert.deepEqual(
    ["Saved", "Try again", "loading", "not-answering"].map(isProse),
    [true, true, false, false]
  );
});
