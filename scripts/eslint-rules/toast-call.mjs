/**
 * How the i18n guard recognises a toast call and the string a `const`
 * holds, for `local/no-literal-copy`. A toast is `<x>.error|success|info|
 * warning(…)` on anything named like a toast (`toast`, `toasts`,
 * `ctx.toast`, `useToastContext()`), or one of those methods bound by
 * `const { error } = useToastContext()`.
 */

import { copyStrings } from "./copy-strings.mjs";

const TOAST_METHODS = new Set(["error", "success", "info", "warning"]);

const isToastObject = (node) => {
  if (node.type === "Identifier") return /toast/i.test(node.name);
  if (node.type === "MemberExpression" && !node.computed)
    return /toast/i.test(node.property.name);
  return (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "useToastContext"
  );
};

/** The declarator that binds `node` (an identifier), if any. */
const declaratorOf = (context, node) => {
  let scope = context.sourceCode.getScope(node);
  while (scope) {
    const variable = scope.set.get(node.name);
    if (variable) {
      const def = variable.defs[0];
      return def?.type === "Variable" ? def : null;
    }
    scope = scope.upper;
  }
  return null;
};

/** `error` bound by `const { error } = useToastContext()`. */
const isDestructuredToast = (context, callee) => {
  if (callee.type !== "Identifier" || !TOAST_METHODS.has(callee.name))
    return false;
  const def = declaratorOf(context, callee);
  return (
    def?.node.id.type === "ObjectPattern" &&
    def.node.init != null &&
    isToastObject(def.node.init)
  );
};

export const isToastCall = (context, { callee }) => {
  if (callee.type !== "MemberExpression")
    return isDestructuredToast(context, callee);
  return (
    !callee.computed &&
    TOAST_METHODS.has(callee.property.name) &&
    isToastObject(callee.object)
  );
};

/** The string a `const NAME = "…"` holds, when `node` names one. */
export const constStrings = (context, node) => {
  if (node.type !== "Identifier") return [];
  const def = declaratorOf(context, node);
  const ok = def?.parent.kind === "const" && def.node.id.type === "Identifier";
  return ok ? copyStrings(def.node.init) : [];
};
