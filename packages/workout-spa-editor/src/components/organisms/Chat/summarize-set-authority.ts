import { type ActionInput, type SummaryContext, text } from "./action-input";

const isSourceNames = (order: unknown): order is string[] =>
  Array.isArray(order) &&
  order.length > 0 &&
  order.every((id) => typeof id === "string" && id !== "");

export const summarizeSetAuthority = (
  input: ActionInput,
  { t, dataTypeLabel }: SummaryContext
): string | null => {
  const type = dataTypeLabel(text(input, "dataType") ?? "");
  if (!type) return null;
  const mode = text(input, "mode");
  if (mode === "union") return t("summary.authority.union", { type });
  const order = input.sourceOrder;
  if (mode !== "priority" || !isSourceNames(order)) return null;
  return t("summary.authority.priority", { type, order: order.join(" → ") });
};
