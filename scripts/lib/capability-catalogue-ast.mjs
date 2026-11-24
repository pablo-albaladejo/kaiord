/**
 * Reads the Capability catalogue the Kaiord App runs on
 * (`CAPABILITY_CATALOGUE` in `lib/capabilities/capability-catalogue.ts`) from
 * its TypeScript AST, so the guard checks the same declarations the App uses
 * instead of a copy that can drift.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const unwrap = (node) =>
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isParenthesizedExpression(node)
    ? unwrap(node.expression)
    : node;

const property = (object, name) =>
  object.properties.find(
    (p) => ts.isPropertyAssignment(p) && p.name.getText() === name
  )?.initializer;

const strings = (node) =>
  node && ts.isArrayLiteralExpression(unwrap(node))
    ? unwrap(node)
        .elements.filter(ts.isStringLiteralLike)
        .map((e) => e.text)
    : [];

const toCapability = (element) => {
  const object = unwrap(element);
  if (!ts.isObjectLiteralExpression(object)) return null;
  const id = property(object, "id");
  const owns = property(object, "owns");
  const owned = (name) =>
    owns && ts.isObjectLiteralExpression(owns)
      ? strings(property(owns, name))
      : [];
  return {
    id: id && ts.isStringLiteralLike(id) ? id.text : "",
    routes: owned("routes"),
    settings: owned("settings"),
  };
};

const findCatalogue = (source) => {
  let found;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText() === "CAPABILITY_CATALOGUE" &&
      node.initializer
    ) {
      found = unwrap(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found && ts.isArrayLiteralExpression(found) ? found : undefined;
};

/** `[{ id, routes, settings }]`, or `[]` when the catalogue cannot be read. */
export function readCatalogue(srcRoot, catalogueFile) {
  let text;
  try {
    text = readFileSync(join(srcRoot, catalogueFile), "utf8");
  } catch {
    return [];
  }
  const source = ts.createSourceFile(
    catalogueFile,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const array = findCatalogue(source);
  if (!array) return [];
  return array.elements.map(toCapability).filter((c) => c && c.id !== "");
}
