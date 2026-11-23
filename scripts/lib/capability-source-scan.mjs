/**
 * One pass over the Kaiord App's production source for the Capability
 * surfaces guard: for each file, what it imports (resolved to a path under
 * `src/`), the string literals it spells, and the identifiers it names.
 * Read from the TypeScript AST, so text inside a comment is never counted.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SPA_SRC = join(REPO_ROOT, "packages", "workout-spa-editor", "src");

const SKIP = /\.(test|stories)\.tsx?$|(^|\/)test-utils\//;

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

const isDynamicImport = (node) =>
  ts.isCallExpression(node) &&
  node.expression.kind === ts.SyntaxKind.ImportKeyword &&
  node.arguments[0] &&
  ts.isStringLiteralLike(node.arguments[0]);

const scanFile = (root, file) => {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out = { imports: [], literals: [], identifiers: new Set() };
  const visit = (node) => {
    if (isImportPosition(node) || isDynamicImport(node)) {
      const spec = isDynamicImport(node)
        ? node.arguments[0].text
        : node.moduleSpecifier.text;
      const target = resolveSpecifier(root, file, spec);
      if (target) out.imports.push(target);
      return;
    }
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
