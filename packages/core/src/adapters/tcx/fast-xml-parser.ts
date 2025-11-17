import { XMLParser } from "fast-xml-parser";
import type { KRD } from "../../domain/schemas/krd";
import { createTcxParsingError } from "../../domain/types/errors";
import type { Logger } from "../../ports/logger";
import type { TcxReader } from "../../ports/tcx-reader";
import { convertTcxToKRD } from "./workout/krd.converter";

export const createFastXmlTcxReader =
  (logger: Logger): TcxReader =>
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
