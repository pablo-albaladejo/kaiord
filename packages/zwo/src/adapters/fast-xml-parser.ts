import type { KRD, Logger, TextReader, TextWriter } from "@kaiord/core";
import {
  createUnsupportedKrdTypeError,
  createZwiftParsingError,
  isHealthFileType,
} from "@kaiord/core";
import { XMLParser } from "fast-xml-parser";

import type { ZwiftValidator } from "../types";
import { convertKRDToZwift } from "./krd-to-zwift.converter";
import {
  validateGeneratedZwiftXml,
  validateInputZwiftXml,
  validateZwiftStructure,
} from "./xml-validator-helpers";
import { convertZwiftToKRD } from "./zwift-to-krd.converter";
import { extractIntervalOrder } from "./zwift-to-krd/intervals-extractor";
import {
  keepTextAttribute,
  keepTextTag,
} from "./zwift-to-krd/text-value-processors";

const parseZwiftXml = (
  xmlString: string,
  logger: Logger
): { zwiftData: unknown; intervalOrder: Array<string> } => {
  logger.debug("Parsing Zwift file");

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
      attributeValueProcessor: keepTextAttribute,
      tagValueProcessor: keepTextTag,
    });

    return {
      zwiftData: parser.parse(xmlString),
      intervalOrder: extractIntervalOrder(xmlString),
    };
  } catch (error) {
    logger.error("Failed to parse Zwift XML", { error });
    throw createZwiftParsingError("Failed to parse Zwift file", error);
  }
};

export const createFastXmlZwiftReader =
  (logger: Logger, validator: ZwiftValidator): TextReader =>
  async (xmlString: string): Promise<KRD> => {
    await validateInputZwiftXml(xmlString, validator, logger);
    const { zwiftData, intervalOrder } = parseZwiftXml(xmlString, logger);
    validateZwiftStructure(zwiftData, logger);

    logger.info("Zwift file parsed successfully");
    return convertZwiftToKRD(zwiftData, logger, intervalOrder);
  };

export const createFastXmlZwiftWriter =
  (logger: Logger, validator: ZwiftValidator): TextWriter =>
  async (krd: KRD): Promise<string> => {
    if (isHealthFileType(krd.type)) {
      throw createUnsupportedKrdTypeError(krd.type, "zwo");
    }

    logger.debug("Converting KRD to Zwift format");

    let xmlString: string;
    try {
      xmlString = convertKRDToZwift(krd, logger);
    } catch (error) {
      logger.error("Failed to convert KRD to Zwift", { error });
      throw createZwiftParsingError("Failed to convert KRD to Zwift", error);
    }

    await validateGeneratedZwiftXml(xmlString, validator, logger);

    logger.info("KRD to Zwift conversion successful");
    return xmlString;
  };
