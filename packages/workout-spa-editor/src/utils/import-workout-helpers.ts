import type { KRD } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import { getFormatErrorMessage } from "./file-format-detector";

/**
 * Import KRD/JSON file directly
 */
export const importKrdFile = async (
  uint8Array: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  try {
    const text = new TextDecoder().decode(uint8Array);
    const krd = JSON.parse(text) as KRD;
    onProgress?.(100);
    return krd;
  } catch (error) {
    throw new Error(
      `Failed to parse KRD JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

/**
 * Import FIT file using @kaiord/core
 */
export const importFitFile = async (
  uint8Array: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  try {
    const providers = createDefaultProviders();
    onProgress?.(50);

    const krd = await providers.convertFitToKrd({ fitBuffer: uint8Array });
    onProgress?.(100);

    return krd;
  } catch (error) {
    const errorMessage = getFormatErrorMessage("fit");
    throw new Error(
      `${errorMessage} ${error instanceof Error ? error.message : ""}`
    );
  }
};

/**
 * Import TCX file using @kaiord/core (not yet implemented)
 */
export const importTcxFile = async (
  _uint8Array: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  try {
    onProgress?.(50);

    // TODO: Implement TCX conversion once @kaiord/core supports it
    // const providers = createDefaultProviders();
    // const krd = await providers.convertTcxToKrd({ tcxBuffer: uint8Array });

    onProgress?.(100);

    throw new Error(
      "TCX format conversion is not yet implemented in @kaiord/core"
    );
  } catch (error) {
    const errorMessage = getFormatErrorMessage("tcx");
    throw new Error(
      `${errorMessage} ${error instanceof Error ? error.message : ""}`
    );
  }
};

/**
 * Import PWX file using @kaiord/core (not yet implemented)
 */
export const importPwxFile = async (
  _uint8Array: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  try {
    onProgress?.(50);

    // TODO: Implement PWX conversion once @kaiord/core supports it
    // const providers = createDefaultProviders();
    // const krd = await providers.convertPwxToKrd({ pwxBuffer: uint8Array });

    onProgress?.(100);

    throw new Error(
      "PWX format conversion is not yet implemented in @kaiord/core"
    );
  } catch (error) {
    const errorMessage = getFormatErrorMessage("pwx");
    throw new Error(
      `${errorMessage} ${error instanceof Error ? error.message : ""}`
    );
  }
};
