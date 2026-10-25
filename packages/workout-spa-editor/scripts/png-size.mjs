import sharp from "sharp";

/**
 * Pixel size of a PNG that actually decodes. Reading IHDR alone would pass a
 * file truncated after its header, so every pixel is decoded, and any decoder
 * warning (truncation, a bad CRC) is an error.
 */
export async function decodedPngSize(bytes) {
  const { format } = await sharp(bytes).metadata();
  if (format !== "png") throw new Error(`not a PNG: ${format}`);
  const { info } = await sharp(bytes, { failOn: "warning" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height };
}
