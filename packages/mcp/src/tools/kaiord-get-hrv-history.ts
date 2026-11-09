import { createRegisterHealthHistoryTool } from "./health/create-health-history-tool";

export const registerGetHrvHistoryTool = createRegisterHealthHistoryTool({
  name: "kaiord_get_hrv_history",
  description:
    "List HRV summaries from input files sorted by measuredAt ascending",
  inputNoun: "HRV summaries",
  krdType: "hrv_summary",
  healthKey: "hrv",
});
