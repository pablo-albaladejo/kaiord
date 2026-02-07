/**
 * Garmin FIT SDK Adapter - converts FIT workout files to KRD format
 * References: https://developer.garmin.com/fit/file-types/workout/
 */

import { Decoder, Encoder, Stream } from "@garmin/fitsdk";
import type { KRD } from "@kaiord/core";
import { createFitParsingError } from "@kaiord/core";
import type { FitReader } from "@kaiord/core";
import type { FitWriter } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { convertKRDToMessages } from "./krd-to-fit/krd-to-fit.converter";
import { mapMessagesToKRD } from "./messages/messages.mapper";
import type { FitMessages } from "./shared/types";

export const createGarminFitSdkReader =
  (logger: Logger): FitReader =>
  async (buffer: Uint8Array): Promise<KRD> => {
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
      return mapMessagesToKRD(messages as FitMessages, logger);
    } catch (error) {
      if (error instanceof Error && error.name === "FitParsingError") {
        throw error;
      }
      logger.error("Failed to parse FIT file", { error });
      throw createFitParsingError("Failed to parse FIT file", error);
    }
  };

export const createGarminFitSdkWriter =
  (logger: Logger): FitWriter =>
  async (krd: KRD): Promise<Uint8Array> => {
    try {
      logger.debug("Encoding KRD to FIT");

      const encoder = new Encoder();
      const messages = convertKRDToMessages(krd, logger);

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        try {
          logger.debug(`Writing message ${i + 1}/${messages.length}`, {
            mesgNum: (message as { mesgNum?: number }).mesgNum,
          });
          encoder.writeMesg(message);
        } catch (error) {
          logger.error(`Failed to write message ${i + 1}`, {
            message: JSON.stringify(message, null, 2),
            error,
          });
          throw error;
        }
      }

      const buffer = encoder.close();
      logger.info("KRD encoded to FIT successfully");
      return new Uint8Array(buffer);
    } catch (error) {
      if (error instanceof Error && error.name === "FitParsingError") {
        throw error;
      }
      logger.error("Failed to write FIT file", { error });
      throw createFitParsingError("Failed to write FIT file", error);
    }
  };
