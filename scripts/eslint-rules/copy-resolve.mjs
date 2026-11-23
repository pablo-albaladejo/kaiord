/**
 * Follows a name to the copy it stands for, one step, inside the file:
 * a `const` that holds a string (`const L = "Saved"; … {L}`) and a local
 * function that returns one (`const label = () => "On"; … {label()}`).
 * An import, a parameter or a `let` is not followed: its value is not known
 * here. Used as the `resolve` of `copyStrings`.
 */

import { copyStrings } from "./copy-strings.mjs";

/** The first definition of the variable `node` (an identifier) names. */
export const definitionOf = (context, node) => {
  let scope = context.sourceCode.getScope(node);
  while (scope) {
    const variable = scope.set.get(node.name);
    if (variable) return variable.defs[0] ?? null;
    scope = scope.upper;
  }
  return null;
};

const FUNCTIONS = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

/** The function `def` binds: a declaration or a `const` holding one. */
const functionOf = (def) => {
  if (def?.type === "FunctionName") return def.node;
  if (def?.type !== "Variable" || def.parent.kind !== "const") return null;
  return FUNCTIONS.has(def.node.init?.type) ? def.node.init : null;
};

/** The arguments of a function's own `return`s, nested functions skipped. */
const returnedNodes = (fn) => {
  if (fn.body.type !== "BlockStatement") return [fn.body];
  const found = [];
  const walk = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "ReturnStatement") found.push(node.argument);
    for (const [key, value] of Object.entries(node)) {
      if (key === "parent") continue;
      for (const child of Array.isArray(value) ? value : [value])
        if (child && typeof child === "object" && !FUNCTIONS.has(child.type))
          walk(child);
    }
  };
  walk(fn.body);
  return found;
};

/** The strings a `const NAME = …` holds, when `node` names one. */
export const constStrings = (context, node) => {
  if (node.type !== "Identifier") return [];
  const def = definitionOf(context, node);
  const ok =
    def?.type === "Variable" &&
    def.parent.kind === "const" &&
    def.node.id.type === "Identifier" &&
    !FUNCTIONS.has(def.node.init?.type);
  return ok ? copyStrings(def.node.init) : [];
};

/** The strings a local function returns, when `node` calls one by name. */
export const returnedStrings = (context, node) => {
  if (node.type !== "CallExpression" || node.callee.type !== "Identifier")
    return [];
  const fn = functionOf(definitionOf(context, node.callee));
  return fn ? returnedNodes(fn).flatMap((n) => copyStrings(n)) : [];
};

/** A `resolve` for `copyStrings` bound to the file being linted. */
export const resolverFor = (context) => (node) =>
  node.type === "Identifier"
    ? constStrings(context, node)
    : returnedStrings(context, node);
