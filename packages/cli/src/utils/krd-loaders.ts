import type { KRD, Logger } from "@kaiord/core";
import {
  fromBinary,
  fromText,
  toBinary,
  toText,
  validateKrd,
} from "@kaiord/core";

/**
 * Per-format readers/writers loaded via dynamic import so each CLI invocation
 * only pulls the adapter chunk it actually needs.
 */

export const fitToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (!(data instanceof Uint8Array))
    throw new Error("FIT input must be Uint8Array");
  const { createFitReader } = await import("@kaiord/fit");
  return fromBinary(data, createFitReader(logger), logger);
};

export const tcxToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (typeof data !== "string") throw new Error("TCX input must be string");
  const { createTcxReader } = await import("@kaiord/tcx");
  return fromText(data, createTcxReader(logger), logger);
};

export const zwoToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (typeof data !== "string") throw new Error("ZWO input must be string");
  const { createZwiftReader } = await import("@kaiord/zwo");
  return fromText(data, createZwiftReader(logger), logger);
};

export const gcnToKrd = async (data: Uint8Array | string, logger: Logger) => {
  if (typeof data !== "string") throw new Error("GCN input must be string");
  const { createGarminReader } = await import("@kaiord/garmin");
  return fromText(data, createGarminReader(logger), logger);
};

export const krdToKrd = (data: Uint8Array | string): KRD => {
  if (typeof data !== "string") throw new Error("KRD input must be string");
  return validateKrd(JSON.parse(data));
};

export const krdToFit = async (krd: KRD, logger: Logger) => {
  const { createFitWriter } = await import("@kaiord/fit");
  return toBinary(krd, createFitWriter(logger), logger);
};

export const krdToTcx = async (krd: KRD, logger: Logger) => {
  const { createTcxWriter } = await import("@kaiord/tcx");
  return toText(krd, createTcxWriter(logger), logger);
};

export const krdToZwo = async (krd: KRD, logger: Logger) => {
  const { createZwiftWriter } = await import("@kaiord/zwo");
  return toText(krd, createZwiftWriter(logger), logger);
};

export const krdToGcn = async (krd: KRD, logger: Logger) => {
  const { createGarminWriter } = await import("@kaiord/garmin");
  return toText(krd, createGarminWriter(logger), logger);
};

export const krdToText = (krd: KRD): string => {
  validateKrd(krd);
  return JSON.stringify(krd, null, 2);
};
