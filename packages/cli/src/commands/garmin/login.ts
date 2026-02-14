import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";
import { createCliGarminClient } from "./client-factory";
import { loginOptionsSchema } from "./types";

export const loginCommand = async (
  argv: Record<string, unknown>,
  logger: Logger
): Promise<number> => {
  const options = loginOptionsSchema.parse(argv);

  try {
    const { auth } = await createCliGarminClient(logger);
    await auth.login(options.email, options.password);

    if (options.json) {
      console.log(JSON.stringify({ success: true }));
    } else {
      logger.info("Logged in to Garmin Connect");
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof ServiceAuthError) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: error.message }));
      } else {
        logger.error("Login failed", { error: error.message });
      }
      return ExitCode.AUTH_ERROR;
    }
    throw error;
  }
};
