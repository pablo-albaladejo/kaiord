import { XMLBuilder, XMLParser } from "fast-xml-parser";
import type { KRD, TextReader, TextWriter } from "@kaiord/core";
import { createTcxParsingError, createTcxValidationError } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import type { TcxValidator } from "../types";
import { convertTcxToKRD } from "./workout/krd.converter";
import { convertKRDToTcx as convertKRDToTcxStructure } from "./workout/tcx.converter";

export const createFastXmlTcxReader =
  (logger: Logger): TextReader =>
  async (xmlString: string): Promise<KRD> => {
    logger.debug("Parsing TCX file", { xmlLength: xmlString.length });

    let tcxData: unknown;
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      tcxData = parser.parse(xmlString);
    } catch (error) {
      logger.error("Failed to parse TCX XML", { error });
      throw createTcxParsingError("Failed to parse TCX file", error);
    }

    if (
      !tcxData ||
      typeof tcxData !== "object" ||
      !("TrainingCenterDatabase" in tcxData)
    ) {
      const error = createTcxParsingError(
        "Invalid TCX format: missing TrainingCenterDatabase element"
      );
      logger.error("Invalid TCX structure", { error });
      throw error;
    }

    logger.info("TCX file parsed successfully");

    return convertTcxToKRD(tcxData, logger);
  };

export const createFastXmlTcxWriter =
  (logger: Logger, validator: TcxValidator): TextWriter =>
  async (krd: KRD): Promise<string> => {
    logger.debug("Encoding KRD to TCX");

    let tcxData: unknown;
    try {
      tcxData = convertKRDToTcx(krd, logger);
    } catch (error) {
      logger.error("Failed to convert KRD to TCX structure", { error });
      throw createTcxParsingError("Failed to convert KRD to TCX", error);
    }

    let xmlString: string;
    try {
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true,
        indentBy: "  ",
      });

      xmlString = builder.build(tcxData);
    } catch (error) {
      logger.error("Failed to build TCX XML", { error });
      throw createTcxParsingError("Failed to build TCX XML", error);
    }

    logger.debug("Validating generated TCX against XSD");

    const validationResult = await validator(xmlString);
    if (!validationResult.valid) {
      logger.error("Generated TCX does not conform to XSD schema", {
        errors: validationResult.errors,
      });
      throw createTcxValidationError(
        "Generated TCX file does not conform to XSD schema",
        validationResult.errors.map((err) => ({
          field: err.path,
          message: err.message,
        }))
      );
    }

    logger.info("KRD encoded to TCX successfully");
    return xmlString;
  };

const convertKRDToTcx = (krd: KRD, logger: Logger): unknown => {
  return convertKRDToTcxStructure(krd, logger);
};
