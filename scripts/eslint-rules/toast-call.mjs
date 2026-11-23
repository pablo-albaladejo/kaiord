/**
 * How the i18n guard recognises a toast call, for `local/no-literal-copy`.
 * A toast is `toast(…)` itself, or `<x>.error|success|info|warning(…)` on
 * anything named like a toast (`toast`, `toasts`, `ctx.toast`,
 * `useToastContext()`), or one of those methods bound by
 * `const { error } = useToastContext()`.
 */

import { definitionOf } from "./copy-resolve.mjs";

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

/** `error` bound by `const { error } = useToastContext()`. */
const isDestructuredToast = (context, callee) => {
  if (!TOAST_METHODS.has(callee.name)) return false;
  const def = definitionOf(context, callee);
  return (
    def?.type === "Variable" &&
    def.node.id.type === "ObjectPattern" &&
    def.node.init != null &&
    isToastObject(def.node.init)
  );
};

export const isToastCall = (context, { callee }) => {
  if (callee.type === "Identifier")
    return callee.name === "toast" || isDestructuredToast(context, callee);
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    TOAST_METHODS.has(callee.property.name) &&
    isToastObject(callee.object)
  );
};
