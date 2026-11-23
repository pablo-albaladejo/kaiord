import { type ActionInput, type SummaryContext, text } from "./action-input";

export const summarizeSetDataRoute = (
  input: ActionInput,
  { t, dataTypeLabel }: SummaryContext
): string | null => {
  const action = text(input, "action");
  const type = dataTypeLabel(text(input, "dataType") ?? "");
  const integration = text(input, "integrationId");
  const direction = text(input, "direction");
  if (!type || !integration) return null;
  if (action !== "enable_route" && action !== "disable_route") return null;
  if (direction !== "import" && direction !== "export") return null;
  const verb = action === "enable_route" ? "enable" : "disable";
  return t(`summary.route.${verb}.${direction}`, { type, integration });
};
