import { createRegisterHealthHistoryTool } from "./health/create-health-history-tool";

export const registerGetWeightHistoryTool = createRegisterHealthHistoryTool({
  name: "kaiord_get_weight_history",
  description:
    "List weight measurements from input files sorted by measuredAt ascending",
  inputNoun: "weight measurements",
  krdType: "weight_measurement",
  healthKey: "weight",
});
