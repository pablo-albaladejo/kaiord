import type { Logger } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";
import { createCliGarminClient } from "./client-factory";

export const logoutCommand = async (
  logger: Logger,
  json?: boolean
): Promise<number> => {
  const { auth } = await createCliGarminClient(logger);
  await auth.logout();

  if (json) {
    console.log(JSON.stringify({ success: true }));
  } else {
    logger.info("Logged out from Garmin Connect");
  }

  return ExitCode.SUCCESS;
};
