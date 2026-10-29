import { Encoder } from "@garmin/fitsdk";

export type FitWriterOptions = {
  /**
   * @internal Upper bound, in bytes, on the encoder's resizable output buffer.
   * Needs the monorepo's patched `@garmin/fitsdk`; without the patch the
   * writer throws instead of silently reserving the SDK's 500 MB default.
   */
  maxOutputBytes?: number;
};

const HALF_MEGABYTE = 512 * 1024;

export const createEncoder = (options: FitWriterOptions = {}): Encoder => {
  const { maxOutputBytes } = options;
  if (maxOutputBytes === undefined) return new Encoder();

  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) {
    throw new RangeError("maxOutputBytes must be a positive integer");
  }
  if (Encoder.supportsOutputStreamOptions !== true) {
    throw new Error(
      "maxOutputBytes needs the patched @garmin/fitsdk that forwards OutputStream options"
    );
  }
  const initialByteLength = Math.min(HALF_MEGABYTE, maxOutputBytes);
  return new Encoder({
    outputStream: {
      initialByteLength,
      maxByteLength: maxOutputBytes,
      resizeByBytes: initialByteLength,
    },
  });
};
