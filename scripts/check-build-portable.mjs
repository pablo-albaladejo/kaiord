#!/usr/bin/env node
// SCOPE: enforces ONLY Decision 10's three trip-wires (env-var define:,
// NODE_VERSION conditionals, native bindings). Adding new checks
// requires a separate guard with its own design entry in
// openspec/changes/<slug>/design.md.
//
// Rule R-BuildPortable: the build-artifacts artifact (packages/*/dist)
// MUST be byte-identical across the Node-version matrix. Trip-wires:
//
//   1. tsup.config.* / vite.config.* `define:` blocks whose VALUES
//      read process.env.* (other than NODE_ENV as a comparison
//      operand).
//   2. process.env.NODE_VERSION references in build-time code under
//      packages/*/src/.
//   3. native bindings (*.node, *.so, *.dylib) under packages/*/dist.
//
// If any trip-wire fires, Decision 2 (one artifact for both Node legs)
// no longer holds and the fan-out must re-matrix.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

const CONFIG_FILE_RE = /^(tsup|vite)\.config\.(ts|mts|cts)$/;
const NATIVE_BINDING_RE = /\.(node|so|dylib)$/;
const SOURCE_FILE_RE = /\.(ts|tsx|mjs|cjs)$/;

function listPackageDirs(packagesRoot) {
  try {
    return readdirSync(packagesRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(packagesRoot, d.name));
  } catch {
    return [];
  }
}

function findFilesMatching(rootDir, predicate, results = []) {
  let entries;
  try {
    entries = readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(rootDir, entry.name);
    if (entry.isDirectory()) {
      findFilesMatching(full, predicate, results);
    } else if (entry.isFile() && predicate(entry.name, full)) {
      results.push(full);
    }
  }
  return results;
}

function isProcessEnvAccess(node) {
  if (!node) return false;
  if (!ts.isPropertyAccessExpression(node)) return false;
  const obj = node.expression;
  if (!ts.isPropertyAccessExpression(obj)) return false;
  return (
    ts.isIdentifier(obj.expression) &&
    obj.expression.text === "process" &&
    ts.isIdentifier(obj.name) &&
    obj.name.text === "env"
  );
}

function envName(node) {
  if (!isProcessEnvAccess(node)) return null;
  return ts.isIdentifier(node.name) ? node.name.text : null;
}

function valueReadsEnv(node) {
  if (!node) return false;
  if (envName(node)) return true;
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    const isJsonStringify =
      ts.isPropertyAccessExpression(callee) &&
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === "JSON" &&
      ts.isIdentifier(callee.name) &&
      callee.name.text === "stringify";
    if (isJsonStringify && node.arguments.some(valueReadsEnv)) return true;
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (node.body) return valueReadsEnv(node.body);
  }
  if (ts.isBlock(node)) {
    return node.statements.some(valueReadsEnv);
  }
  if (ts.isReturnStatement(node)) {
    return valueReadsEnv(node.expression);
  }
  if (ts.isBinaryExpression(node)) {
    // Catches `process.env.X || 'default'`, `process.env.X ?? 'd'`,
    // `'prefix' + process.env.X`, etc. Whitelist the comparison form
    // `process.env.NODE_ENV === 'production'` (left or right operand
    // is the NODE_ENV access AND the operator is a comparison).
    const isComparison =
      node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
      node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken;
    if (isComparison) {
      const leftIsNodeEnv = envName(node.left) === "NODE_ENV";
      const rightIsNodeEnv = envName(node.right) === "NODE_ENV";
      if (leftIsNodeEnv || rightIsNodeEnv) return false;
    }
    return valueReadsEnv(node.left) || valueReadsEnv(node.right);
  }
  if (ts.isTemplateExpression(node)) {
    // Template literal like `` `http://${process.env.HOST}` ``.
    return node.templateSpans.some((s) => valueReadsEnv(s.expression));
  }
  if (ts.isConditionalExpression(node)) {
    return valueReadsEnv(node.whenTrue) || valueReadsEnv(node.whenFalse);
  }
  if (ts.isParenthesizedExpression(node)) return valueReadsEnv(node.expression);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.some((p) => {
      if (ts.isPropertyAssignment(p)) return valueReadsEnv(p.initializer);
      if (ts.isSpreadAssignment(p)) return valueReadsEnv(p.expression);
      return false;
    });
  }
  return false;
}

function visitDefineProperties(defineObject, file, violations) {
  for (const prop of defineObject.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const computedKey =
        prop.name && ts.isComputedPropertyName(prop.name)
          ? prop.name.expression
          : null;
      if (computedKey && valueReadsEnv(computedKey)) {
        violations.push({
          rule: "R-BuildPortable",
          file: relative(REPO_ROOT, file),
          detail:
            "Computed `define:` key reads process.env (build-time injection)",
        });
        continue;
      }
      if (valueReadsEnv(prop.initializer)) {
        violations.push({
          rule: "R-BuildPortable",
          file: relative(REPO_ROOT, file),
          detail:
            "`define:` value reads process.env (build-time injection — Decision 10 trip-wire)",
        });
      }
    } else if (ts.isSpreadAssignment(prop)) {
      if (valueReadsEnv(prop.expression)) {
        violations.push({
          rule: "R-BuildPortable",
          file: relative(REPO_ROOT, file),
          detail:
            "Spread into `define:` reads process.env (build-time injection)",
        });
      }
    }
  }
}

function inspectConfigObject(obj, file, violations) {
  if (!obj || !ts.isObjectLiteralExpression(obj)) return;
  for (const prop of obj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === "define" &&
      ts.isObjectLiteralExpression(prop.initializer)
    ) {
      visitDefineProperties(prop.initializer, file, violations);
    }
  }
}

function findDefineCalls(node, file, violations) {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "defineConfig"
  ) {
    const arg = node.arguments[0];
    if (arg && ts.isObjectLiteralExpression(arg)) {
      // Object form: defineConfig({ define: {...} })
      inspectConfigObject(arg, file, violations);
    } else if (
      arg &&
      (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg))
    ) {
      // Factory form: defineConfig((env) => ({ define: {...} })).
      // tsup and vite both document this as a first-class pattern for
      // env-dependent config. The body is either an expression
      // (concise arrow) or a block whose return statement carries the
      // config object.
      const body = arg.body;
      if (body) {
        if (ts.isObjectLiteralExpression(body)) {
          inspectConfigObject(body, file, violations);
        } else if (
          ts.isParenthesizedExpression(body) &&
          ts.isObjectLiteralExpression(body.expression)
        ) {
          inspectConfigObject(body.expression, file, violations);
        } else if (ts.isBlock(body)) {
          for (const stmt of body.statements) {
            if (ts.isReturnStatement(stmt) && stmt.expression) {
              if (ts.isObjectLiteralExpression(stmt.expression)) {
                inspectConfigObject(stmt.expression, file, violations);
              } else if (
                ts.isParenthesizedExpression(stmt.expression) &&
                ts.isObjectLiteralExpression(stmt.expression.expression)
              ) {
                inspectConfigObject(
                  stmt.expression.expression,
                  file,
                  violations
                );
              }
            }
          }
        }
      }
    }
  }
  ts.forEachChild(node, (child) => findDefineCalls(child, file, violations));
}

function checkConfigFile(file, violations) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  findDefineCalls(sf, file, violations);
}

function checkNodeVersionInSrc(packageDir, violations) {
  const srcDir = join(packageDir, "src");
  try {
    statSync(srcDir);
  } catch {
    return;
  }
  const files = findFilesMatching(srcDir, (name) => SOURCE_FILE_RE.test(name));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (text.includes("process.env.NODE_VERSION")) {
      violations.push({
        rule: "R-BuildPortable",
        file: relative(REPO_ROOT, file),
        detail:
          "process.env.NODE_VERSION reference in build-time code (Decision 10 trip-wire 2)",
      });
    }
  }
}

function checkDistNativeBindings(packageDir, violations) {
  const distDir = join(packageDir, "dist");
  try {
    statSync(distDir);
  } catch {
    return;
  }
  const files = findFilesMatching(distDir, (name) =>
    NATIVE_BINDING_RE.test(name)
  );
  for (const file of files) {
    violations.push({
      rule: "R-BuildPortable",
      file: relative(REPO_ROOT, file),
      detail:
        "Native binding shipped in dist/ (Decision 10 trip-wire 3 — non-portable)",
    });
  }
}

export function runCheck({ packagesRoot } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const violations = [];
  for (const pkgDir of listPackageDirs(root)) {
    const configs = readdirSync(pkgDir, { withFileTypes: true })
      .filter((d) => d.isFile() && CONFIG_FILE_RE.test(d.name))
      .map((d) => join(pkgDir, d.name));
    for (const config of configs) {
      checkConfigFile(config, violations);
    }
    checkNodeVersionInSrc(pkgDir, violations);
    checkDistNativeBindings(pkgDir, violations);
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const violations = runCheck();
  if (violations.length === 0) {
    console.log("✅ No build-portability violations detected.");
    process.exit(0);
  }
  console.error("❌ R-BuildPortable violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
