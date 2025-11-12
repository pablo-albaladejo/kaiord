import { Decoder, Stream } from "@garmin/fitsdk";
import type { KRD } from "../../domain/schemas/krd";
import { createFitParsingError } from "../../domain/types/errors";
import type { FitReader } from "../../ports/fit-reader";
import type { Logger } from "../../ports/logger";

export const createGarminFitSdkReader = (logger: Logger): FitReader => ({
  readToKRD: async (buffer: Uint8Array): Promise<KRD> => {
    try {
      logger.debug("Parsing FIT file", { bufferSize: buffer.length });

      if (buffer.length === 0) {
        logger.error("Empty FIT buffer");
        throw createFitParsingError("Cannot parse empty FIT buffer");
      }

      const stream = Stream.fromByteArray(Array.from(buffer));
      const decoder = new Decoder(stream);
      const { messages, errors } = decoder.read();

      if (errors.length > 0) {
        logger.error("FIT parsing errors detected", { errors });
        throw createFitParsingError(`FIT parsing errors: ${errors.join(", ")}`);
      }

      logger.info("FIT file parsed successfully");
      return convertMessagesToKRD(messages, logger);
    } catch (error) {
      if (error instanceof Error && error.name === "FitParsingError") {
        throw error;
      }
      logger.error("Failed to parse FIT file", { error });
      throw createFitParsingError("Failed to parse FIT file", error);
    }
  },
});

const convertMessagesToKRD = (
  messages: Record<string, unknown>,
  logger: Logger
): KRD => {
  logger.debug("Converting FIT messages to KRD", {
    messageCount: Object.keys(messages).length,
  });

  // Minimal skeleton implementation to satisfy the contract
  // This will be expanded in task 8.3
  const krd: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport: "cycling",
    },
  };

  return krd;
};
