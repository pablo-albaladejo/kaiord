const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

export const decodeBase64 = (input: string): Uint8Array => {
  const trimmed = input.replace(/\s/g, "");
  if (!BASE64_PATTERN.test(trimmed)) {
    throw new Error(
      "Invalid base64 content. Ensure binary file data is base64-encoded."
    );
  }
  const buffer = Buffer.from(trimmed, "base64");
  if (buffer.length === 0 && trimmed.length > 0) {
    throw new Error("Base64 decoding produced empty buffer.");
  }
  return new Uint8Array(buffer);
};
