/**
 * One pass over the Kaiord App's production source for the Capability
 * surfaces guard: for each file, what it imports (`capability-source-imports`),
 * the string literals it spells, the identifiers it names, the `a.b` member
 * accesses it makes and the tables it opens by name (`.table("x")`). Read
 * from the TypeScript AST, so text inside a comment is never counted.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { importOf } from "./capability-source-imports.mjs";

export { stripModule } from "./capability-source-imports.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

const SKIP = /\.(test|stories)\.tsx?$|(^|\/)test-utils\//;

const toPosix = (p) => p.replaceAll("\\", "/");

const lastName = (node) =>
  ts.isIdentifier(node)
    ? node.text
    : ts.isPropertyAccessExpression(node)
      ? node.name.text
      : undefined;

const tableName = (node) =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "table" &&
  node.arguments[0] &&
  ts.isStringLiteralLike(node.arguments[0])
    ? node.arguments[0].text
    : undefined;

const scanFile = (root, file) => {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out = {
    imports: [],
    literals: [],
    identifiers: new Set(),
    accesses: new Set(),
    tables: new Set(),
  };
  const visit = (node) => {
    const imported = importOf(root, file, node);
    if (imported !== null && imported !== undefined) {
      out.imports.push(imported);
      return;
    }
    if (ts.isPropertyAccessExpression(node)) {
      out.accesses.add(`${lastName(node.expression)}.${node.name.text}`);
    }
    const table = tableName(node);
    if (table !== undefined) out.tables.add(table);
    if (ts.isStringLiteralLike(node)) out.literals.push(node.text);
    else if (ts.isTemplateHead(node)) out.literals.push(node.text);
    else if (ts.isIdentifier(node)) out.identifiers.add(node.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { path: toPosix(relative(root, file)), ...out };
};

const walk = (root, dir, files) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    const rel = toPosix(relative(root, abs));
    if (entry.isDirectory()) walk(root, abs, files);
    else if (/\.tsx?$/.test(entry.name) && !SKIP.test(rel)) {
      files.push(scanFile(root, abs));
    }
  }
  return files;
};

/** Every production source file under `srcRoot`, scanned. */
export const scanSources = (srcRoot) => walk(srcRoot, srcRoot, []);

/** A declared file exists, or a declared folder (trailing `/`) does. */
export const exists = (srcRoot, rel) => {
  try {
    const stat = statSync(join(srcRoot, rel));
    return rel.endsWith("/") ? stat.isDirectory() : stat.isFile();
  } catch {
    return false;
  }
};
