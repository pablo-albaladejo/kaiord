/**
 * The imports of one source file for the Capability surfaces guard: each
 * resolved to a path under `src/`, and whether it brings in values or only
 * types (`import type`, or every named specifier marked `type`), since only
 * a value import of the read API asks it anything.
 */

import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

const toPosix = (p) => p.replaceAll("\\", "/");

/** A specifier's target under `src/`, without extension or `/index`. */
export const stripModule = (p) =>
  p.replace(/\.(?:tsx?|jsx?)$/, "").replace(/\/index$/, "");

const resolveSpecifier = (root, file, spec) => {
  if (spec.startsWith("@/")) return stripModule(spec.slice(2));
  if (!spec.startsWith(".")) return null;
  return stripModule(toPosix(relative(root, resolve(dirname(file), spec))));
};

const isImportPosition = (node) =>
  (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
  node.moduleSpecifier &&
  ts.isStringLiteralLike(node.moduleSpecifier);

export const isDynamicImport = (node) =>
  ts.isCallExpression(node) &&
  node.expression.kind === ts.SyntaxKind.ImportKeyword &&
  node.arguments[0] &&
  ts.isStringLiteralLike(node.arguments[0]);

const everySpecifierIsType = (elements) =>
  elements.length > 0 && elements.every((e) => e.isTypeOnly);

const typeOnly = (node) => {
  if (ts.isExportDeclaration(node)) {
    return (
      node.isTypeOnly ||
      (node.exportClause !== undefined &&
        ts.isNamedExports(node.exportClause) &&
        everySpecifierIsType(node.exportClause.elements))
    );
  }
  const clause = node.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const named = clause.namedBindings;
  return (
    clause.name === undefined &&
    named !== undefined &&
    ts.isNamedImports(named) &&
    everySpecifierIsType(named.elements)
  );
};

/** `{ target, typeOnly }` for an import position, or `null`. */
export const importOf = (root, file, node) => {
  if (isDynamicImport(node)) {
    const target = resolveSpecifier(root, file, node.arguments[0].text);
    return target && { target, typeOnly: false };
  }
  if (!isImportPosition(node)) return null;
  const target = resolveSpecifier(root, file, node.moduleSpecifier.text);
  return target && { target, typeOnly: typeOnly(node) };
};
