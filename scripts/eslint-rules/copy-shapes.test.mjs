import assert from "node:assert/strict";
import { test } from "node:test";

import { COPY_KEYS, keyName, labelMapOf, setterKind } from "./copy-shapes.mjs";

const call = (name) => ({ callee: { type: "Identifier", name } });
const declarator = (name, init) => ({ id: { type: "Identifier", name }, init });
const OBJECT = { type: "ObjectExpression", properties: [] };

test("should tell a copy setter from a status setter and from any other call", () => {
  // Arrange
  const names = [
    "setError",
    "setNotice",
    "setSaveWarning",
    "setStatus",
    "setSyncStatus",
    "setOpen",
    "setStatuses",
  ];

  // Act
  const kinds = names.map((name) => setterKind(call(name)));

  // Assert
  assert.deepEqual(kinds, [
    "copy",
    "copy",
    "copy",
    "prose",
    "prose",
    null,
    null,
  ]);
  assert.equal(setterKind({ callee: { type: "MemberExpression" } }), null);
});

test("should read every value of a label map and the prose of a names map", () => {
  // Arrange
  const wrapped = { type: "TSAsExpression", expression: OBJECT };

  // Act
  const labels = labelMapOf(declarator("SPORT_LABELS", wrapped));
  const names = labelMapOf(declarator("SPORT_NAMES", OBJECT));
  const other = labelMapOf(declarator("SPORT_ICONS", OBJECT));
  const notObject = labelMapOf(declarator("SPORT_LABELS", { type: "Literal" }));

  // Assert
  assert.deepEqual(labels, { map: OBJECT, kind: "copy" });
  assert.deepEqual(names, { map: OBJECT, kind: "prose" });
  assert.equal(other, null);
  assert.equal(notObject, null);
});

test("should name a property by its identifier or its string key", () => {
  // Arrange
  const byId = { key: { type: "Identifier", name: "tooltip" } };
  const byString = { key: { type: "Literal", value: "emptyText" } };

  // Act
  const names = [keyName(byId), keyName(byString)];

  // Assert
  assert.deepEqual(names, ["tooltip", "emptyText"]);
  assert.ok(names.every((name) => COPY_KEYS.has(name)));
});
