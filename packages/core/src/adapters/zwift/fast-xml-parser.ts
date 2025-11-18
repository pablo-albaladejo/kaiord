import { XMLParser } from "fast-xml-parser";
import type { KRD } from "../../domain/schemas/krd";
import { createZwiftParsingError } from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";
import type { ZwiftReader } from "../../ports/zwift-reader";
import type { ZwiftValidator } from "../../ports/zwift-validator";
import type { ZwiftWriter } from "../../ports/zwift-writer";
import { convertKRDToZwift } from "./krd-to-zwift.converter";
import {
  validateGeneratedZwiftXml,
  validateInputZwiftXml,
  validateZwiftStructure,
} from "./xml-validator-helpers";
import { convertZwiftToKRD } from "./zwift-to-krd.converter";

const parseZwiftXml = (xmlString: string, logger: Logger): unknown => {
  logger.debug("Parsing Zwift file");

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
    });

    return parser.parse(xmlString);
  } catch (error) {
    logger.error("Failed to parse Zwift XML", { error });
    throw createZwiftParsingError("Failed to parse Zwift file", error);
  }
};

export const createFastXmlZwiftReader =
  (logger: Logger, validator: ZwiftValidator): ZwiftReader =>
  async (xmlString: string): Promise<KRD> => {
    await validateInputZwiftXml(xmlString, validator, logger);
    const zwiftData = parseZwiftXml(xmlString, logger);
    validateZwiftStructure(zwiftData, logger);

    logger.info("Zwift file parsed successfully");
    return convertZwiftToKRD(zwiftData, logger);
  };

export const createFastXmlZwiftWriter =
  (logger: Logger, validator: ZwiftValidator): ZwiftWriter =>
  async (krd: KRD): Promise<string> => {
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
