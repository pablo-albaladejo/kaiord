import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";
import { createCliGarminClient } from "./client-factory";
import { listOptionsSchema } from "./types";

const formatTable = (
  workouts: Array<{ id: string; name: string; sport: string }>
): string => {
  const header = "ID\tName\tSport";
  const rows = workouts.map((w) => `${w.id}\t${w.name}\t${w.sport}`);
  return [header, ...rows].join("\n");
};

export const listCommand = async (
  argv: Record<string, unknown>,
  logger: Logger
): Promise<number> => {
  const options = listOptionsSchema.parse(argv);

  try {
    const { auth, service } = await createCliGarminClient(logger);

    if (!auth.is_authenticated()) {
      logger.error("Not authenticated. Run: kaiord garmin login");
      return ExitCode.AUTH_ERROR;
    }

    const workouts = await service.list({
      limit: options.limit,
      offset: options.offset,
    });

    if (options.json) {
      console.log(JSON.stringify(workouts, null, 2));
    } else {
      console.log(formatTable(workouts));
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
