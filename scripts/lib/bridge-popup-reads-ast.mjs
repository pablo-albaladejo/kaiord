/**
 * What `check-bridge-popup-reads.mjs` reads off a bridge's plain-JS source,
 * from the TypeScript AST (so a comment or a string is never code): the top
 * level bindings and the names each one uses, the cases of `handleAction`,
 * string sets and lists declared as literals, the closed list `ALLOWED`, the
 * path-like literals a function spells and the `chrome.storage` writes.
 */

import ts from "typescript";

export const parse = (file, text) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );

const visit = (node, fn) => {
  fn(node);
  ts.forEachChild(node, (child) => visit(child, fn));
};

// Every identifier used as a value inside `node` (not a property name after
// a dot, not an object-literal key).
export const namesUsed = (node) => {
  const names = new Set();
  visit(node, (n) => {
    if (!ts.isIdentifier(n)) return;
    const p = n.parent;
    if (p && ts.isPropertyAccessExpression(p) && p.name === n) return;
    if (p && ts.isPropertyAssignment(p) && p.name === n) return;
    names.add(n.text);
  });
  return names;
};

const declaredNames = (name) =>
  ts.isIdentifier(name)
    ? [name.text]
    : name.elements.flatMap((e) =>
        ts.isOmittedExpression(e) ? [] : declaredNames(e.name)
      );

// Top-level binding name → the node whose code it runs (its initializer, or
// the function). A `let x; try { x = … }` binding takes its assignments.
export const topLevelBindings = (source) => {
  const bindings = new Map();
  const add = (name, node) =>
    bindings.set(name, [...(bindings.get(name) ?? []), node]);
  for (const stmt of source.statements) {
    if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) {
        for (const name of declaredNames(d.name)) add(name, d.initializer ?? d);
      }
    } else if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      add(stmt.name.text, stmt);
    }
  }
  for (const stmt of source.statements) {
    visit(stmt, (n) => {
      if (
        ts.isBinaryExpression(n) &&
        n.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isIdentifier(n.left) &&
        bindings.has(n.left.text)
      ) {
        add(n.left.text, n.right);
      }
    });
  }
  return bindings;
};

// Names reachable from `roots` through the top-level bindings.
export const closureOf = (bindings, roots) => {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const name = queue.shift();
    if (seen.has(name) || !bindings.has(name)) continue;
    seen.add(name);
    for (const node of bindings.get(name)) queue.push(...namesUsed(node));
  }
  return seen;
};

const stringsOf = (node) =>
  node && ts.isArrayLiteralExpression(node)
    ? node.elements.filter(ts.isStringLiteralLike).map((e) => e.text)
    : null;

// `const NAME = new Set([...])` or `const NAME = [...]` of string literals.
export const declaredStrings = (bindings, name) => {
  const [node] = bindings.get(name) ?? [];
  if (!node) return null;
  if (ts.isNewExpression(node) && node.expression.getText() === "Set") {
    return node.arguments?.length ? stringsOf(node.arguments[0]) : [];
  }
  return stringsOf(node);
};

// `handleAction`'s switch: case label → the names its statements use. An
// empty case falls through to the next one; `default` is labelled "default".
export const actionCases = (bindings) => {
  const [fn] = bindings.get("handleAction") ?? [];
  if (!fn) return null;
  let block = null;
  visit(fn, (n) => {
    if (!block && ts.isSwitchStatement(n)) block = n.caseBlock;
  });
  if (!block) return null;
  const cases = new Map();
  let pending = [];
  for (const clause of block.clauses) {
    const label = ts.isDefaultClause(clause)
      ? "default"
      : ts.isStringLiteralLike(clause.expression)
        ? clause.expression.text
        : clause.expression.getText();
    pending.push(label);
    if (clause.statements.length === 0) continue;
    const names = new Set(clause.statements.flatMap((s) => [...namesUsed(s)]));
    for (const l of pending) cases.set(l, names);
    pending = [];
  }
  return cases;
};

// The closed list: each `{ method: "…", pattern: /…/ }` in `ALLOWED`.
export const closedList = (bindings) => {
  const [node] = bindings.get("ALLOWED") ?? [];
  if (!node || !ts.isArrayLiteralExpression(node)) return [];
  return node.elements.filter(ts.isObjectLiteralExpression).flatMap((obj) => {
    const prop = (key) =>
      obj.properties.find(
        (p) => ts.isPropertyAssignment(p) && p.name.getText() === key
      )?.initializer;
    const pattern = prop("pattern");
    if (!pattern || pattern.kind !== ts.SyntaxKind.RegularExpressionLiteral) {
      return [];
    }
    const text = pattern.text;
    const last = text.lastIndexOf("/");
    return [new RegExp(text.slice(1, last), text.slice(last + 1))];
  });
};

const SAMPLES = ["1", "2026-01-05", "a"];

const instances = (parts) =>
  parts.reduce(
    (acc, part) =>
      part === null
        ? acc.flatMap((prefix) => SAMPLES.map((s) => prefix + s))
        : acc.map((prefix) => prefix + part),
    [""]
  );

// Path-like literals (`"/…"`, or a template starting with "/") in `node`,
// each with the concrete paths it can stand for, a `${…}` filled with a
// number, a date or a word.
export const pathLiterals = (node) => {
  const found = [];
  visit(node, (n) => {
    if (ts.isStringLiteralLike(n) && /^\/[\w-]/.test(n.text)) {
      found.push({ text: n.text, paths: [n.text] });
    } else if (ts.isTemplateExpression(n) && /^\/[\w-]/.test(n.head.text)) {
      const parts = [n.head.text];
      for (const span of n.templateSpans) parts.push(null, span.literal.text);
      found.push({ text: n.getText(), paths: instances(parts) });
    }
  });
  return found;
};

const storageCall = (n) => {
  if (!ts.isCallExpression(n) || !ts.isPropertyAccessExpression(n.expression)) {
    return null;
  }
  const text = n.expression.expression.getText().replace(/\?/g, "");
  return /(^|\.)chrome\.storage\.\w+$/.test(text)
    ? n.expression.name.text
    : null;
};

// Does `node` touch `chrome.storage` at all?
export const touchesStorage = (node) => {
  let hit = false;
  visit(node, (n) => {
    if (
      ts.isPropertyAccessExpression(n) &&
      /chrome\??\.storage$/.test(n.getText())
    ) {
      hit = true;
    }
  });
  return hit;
};

const WRITES = new Set(["set", "remove", "clear"]);

// Every `chrome.storage.<area>.set(...)` / `.remove` / `.clear` call in
// `node`, with the keys a `set` writes (`null` when they cannot be read).
export const storageWrites = (source) => {
  const consts = new Map();
  visit(source, (n) => {
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.initializer &&
      ts.isStringLiteralLike(n.initializer)
    ) {
      consts.set(n.name.text, n.initializer.text);
    }
  });
  const keyOf = (prop) => {
    if (
      !ts.isPropertyAssignment(prop) &&
      !ts.isShorthandPropertyAssignment(prop)
    ) {
      return null;
    }
    const name = prop.name;
    if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
    if (ts.isComputedPropertyName(name) && ts.isIdentifier(name.expression)) {
      return consts.get(name.expression.text) ?? null;
    }
    return null;
  };
  const writes = [];
  visit(source, (n) => {
    const method = storageCall(n);
    if (!WRITES.has(method)) return;
    const arg = n.arguments[0];
    const keys =
      method === "set" && arg && ts.isObjectLiteralExpression(arg)
        ? arg.properties.map(keyOf)
        : method === "set"
          ? [null]
          : [];
    writes.push({
      method,
      keys,
      line: source.getLineAndCharacterOfPosition(n.getStart()).line + 1,
    });
  });
  return writes;
};
