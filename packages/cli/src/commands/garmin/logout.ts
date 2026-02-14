import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";
import { createCliGarminClient } from "./client-factory";

export const logoutCommand = async (
  logger: Logger,
  json?: boolean
): Promise<number> => {
  try {
    const { auth } = await createCliGarminClient(logger);
    await auth.logout();

    if (json) {
      console.log(JSON.stringify({ success: true }));
    } else {
      logger.info("Logged out from Garmin Connect");
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof ServiceAuthError) {
      if (json) {
        console.log(JSON.stringify({ success: false, error: error.message }));
      } else {
        logger.error("Logout failed", { error: error.message });
      }
      return ExitCode.AUTH_ERROR;
    }
    throw error;
  }
};
