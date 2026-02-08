import type { KRD, Providers } from "@kaiord/core";
import { readFile } from "./file-handler";
import { detectFormat, type FileFormat } from "./format-detector";

/**
 * Load a file and convert it to KRD format
 * Shared utility for convert and diff commands
 * @param filePath - Path to the file
 * @param format - Optional format override (auto-detected if not provided)
 * @param providers - Conversion providers from @kaiord/core
 * @returns KRD object
 */
export const loadFileAsKrd = async (
  filePath: string,
  format: string | undefined,
  providers: Providers
): Promise<KRD> => {
  const detectedFormat = format || detectFormat(filePath);

  if (!detectedFormat) {
    throw new Error(
      `Unable to detect format for file: ${filePath}. ` +
        `Supported formats: .fit, .gcn, .krd, .tcx, .zwo`
    );
  }

  const fileData = await readFile(filePath, detectedFormat as FileFormat);

  return convertToKrd(fileData, detectedFormat, providers);
};

/**
 * Convert raw file data to KRD format
 * @param data - File contents (Uint8Array for FIT, string for others)
 * @param format - File format
 * @param providers - Conversion providers
 * @returns KRD object
 */
export const convertToKrd = async (
  data: Uint8Array | string,
  format: string,
  providers: Providers
): Promise<KRD> => {
  if (format === "fit") {
    if (!(data instanceof Uint8Array)) {
      throw new Error("FIT input must be Uint8Array");
    }
    return providers.convertFitToKrd!({ fitBuffer: data });
  }

  if (format === "tcx") {
    if (typeof data !== "string") {
      throw new Error("TCX input must be string");
    }
    return providers.convertTcxToKrd!({ tcxString: data });
  }

  if (format === "zwo") {
    if (typeof data !== "string") {
      throw new Error("ZWO input must be string");
    }
    return providers.convertZwiftToKrd!({ zwiftString: data });
  }

  if (format === "gcn") {
    if (typeof data !== "string") {
      throw new Error("GCN input must be string");
    }
    return providers.convertGarminToKrd!({ gcnString: data });
  }

  if (format === "krd") {
    if (typeof data !== "string") {
      throw new Error("KRD input must be string");
    }
    return JSON.parse(data) as KRD;
  }

  throw new Error(`Unsupported format: ${format}`);
};

/**
 * Convert KRD to output format
 * @param krd - KRD object to convert
 * @param format - Target format
 * @param providers - Conversion providers
 * @returns Converted data (Uint8Array for FIT, string for others)
 */
export const convertFromKrd = async (
  krd: KRD,
  format: string,
  providers: Providers
): Promise<Uint8Array | string> => {
  if (format === "fit") {
    return providers.convertKrdToFit!({ krd });
  }

  if (format === "tcx") {
    return providers.convertKrdToTcx!({ krd });
  }

  if (format === "zwo") {
    return providers.convertKrdToZwift!({ krd });
  }

  if (format === "gcn") {
    return providers.convertKrdToGarmin!({ krd });
  }

  if (format === "krd") {
    return JSON.stringify(krd, null, 2);
  }

  throw new Error(`Unsupported output format: ${format}`);
};
