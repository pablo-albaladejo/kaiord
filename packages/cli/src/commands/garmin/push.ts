import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";
import { loadFileAsKrd } from "../../utils/krd-converter";
import { createCliGarminClient } from "./client-factory";
import { pushOptionsSchema } from "./types";

export const pushCommand = async (
  argv: Record<string, unknown>,
  logger: Logger
): Promise<number> => {
  const options = pushOptionsSchema.parse(argv);

  try {
    const { auth, service } = await createCliGarminClient(logger);

    if (!auth.is_authenticated()) {
      logger.error("Not authenticated. Run: kaiord garmin login");
      return ExitCode.AUTH_ERROR;
    }

    const krd = await loadFileAsKrd(options.input, options.inputFormat, logger);
    const result = await service.push(krd);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      logger.info("Workout pushed to Garmin Connect", {
        id: result.id,
        name: result.name,
        url: result.url,
      });
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof ServiceAuthError) {
      logger.error("Authentication expired. Run: kaiord garmin login");
      return ExitCode.AUTH_ERROR;
    }
    throw error;
  }
};
