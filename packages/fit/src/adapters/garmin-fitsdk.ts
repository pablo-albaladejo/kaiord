/**
 * Garmin FIT SDK Adapter - converts FIT workout files to KRD format
 * References: https://developer.garmin.com/fit/file-types/workout/
 */

import { Decoder, Encoder, Stream } from "@garmin/fitsdk";
import type { KRD } from "@kaiord/core";
import type { BinaryReader } from "@kaiord/core";
import type { BinaryWriter } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { createConsoleLogger, createFitParsingError } from "@kaiord/core";

import { convertKrdToWeightScaleUploadMessages } from "./health/body-composition/krd-to-weight-scale-fit.converter";
import { convertKRDToMessages } from "./krd-to-fit/krd-to-fit.converter";
import { mapMessagesToKRD } from "./messages/messages.mapper";
import type { FitMessages } from "./shared/types";

/**
 * Encodes a list of raw FIT messages (each carrying a `mesgNum`) into real FIT
 * file bytes via the @garmin/fitsdk `Encoder`. Shared by the workout writer
 * and the body-composition upload path so both drive the same real SDK encode.
 */
export const encodeFitMessages = (
  messages: Array<unknown>,
  logger: Logger
): Uint8Array => {
  const encoder = new Encoder();
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
  return new Uint8Array(encoder.close());
};

/**
 * Converts a KRD carrying weight and/or body composition into real FIT file
 * bytes (a `weight_scale`/mesgNum-30 message) ready to POST to Garmin's upload
 * endpoint. Emits `weight_scale`, not `body_composition` (mesgNum 41), which is
 * absent from the SDK Profile and would throw at the Encoder.
 */
export const encodeBodyCompositionFit = (
  krd: KRD,
  logger?: Logger
): Uint8Array => {
  const log = logger ?? createConsoleLogger();
  const messages = convertKrdToWeightScaleUploadMessages(krd, log);
  return encodeFitMessages(messages, log);
};

export const createGarminFitSdkReader =
  (logger: Logger): BinaryReader =>
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
  (logger: Logger): BinaryWriter =>
  async (krd: KRD): Promise<Uint8Array> => {
    try {
      logger.debug("Encoding KRD to FIT");

      const messages = convertKRDToMessages(krd, logger);
      const buffer = encodeFitMessages(messages, logger);
      logger.info("KRD encoded to FIT successfully");
      return buffer;
    } catch (error) {
      if (error instanceof Error && error.name === "FitParsingError") {
        throw error;
      }
      logger.error("Failed to write FIT file", { error });
      throw createFitParsingError("Failed to write FIT file", error);
    }
  };
