import { type ActionInput, type SummaryContext, text } from "./action-input";

export const summarizeSetDataRoute = (
  input: ActionInput,
  { t, dataTypeLabel }: SummaryContext
): string | null => {
  const action = text(input, "action");
  const dataType = text(input, "dataType");
  const type = dataTypeLabel(dataType ?? "");
  if (!type) return null;

  if (action === "enable_route" || action === "disable_route") {
    const integration = text(input, "integrationId");
    const direction = text(input, "direction");
    if (!integration || (direction !== "import" && direction !== "export")) {
      return null;
    }
    const verb = action === "enable_route" ? "enable" : "disable";
    return t(`summary.route.${verb}.${direction}`, { type, integration });
  }

  if (action === "set_source_policy") {
    const mode = text(input, "mode");
    if (mode === "union") return t("summary.route.union", { type });
    const order = input.sourceOrder;
    const isNames =
      Array.isArray(order) &&
      order.length > 0 &&
      order.every((id) => typeof id === "string" && id !== "");
    if (mode !== "priority" || !isNames) return null;
    return t("summary.route.priority", { type, order: order.join(" → ") });
  }

  return null;
};
