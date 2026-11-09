import { createRegisterHealthHistoryTool } from "./health/create-health-history-tool";

export const registerGetSleepHistoryTool = createRegisterHealthHistoryTool({
  name: "kaiord_get_sleep_history",
  description:
    "List sleep records from input files sorted by startTime ascending",
  inputNoun: "sleep records",
  krdType: "sleep_record",
  healthKey: "sleep",
});
