/**
 * A FIT string field holds at most 255 bytes, its NUL terminator included,
 * so the text itself gets 254 bytes of UTF-8. The SDK Encoder refuses a whole
 * message over that, so every text written to FIT is cut to fit.
 */
export const FIT_STRING_MAX_BYTES = 254;

const utf8 = new TextEncoder();

export const fitStringBytes = (text: string): number =>
  utf8.encode(text).length;

/** The longest prefix of `text` that fits a FIT string, on a character boundary. */
export const fitStringPrefix = (text: string): string => {
  let prefix = "";
  let bytes = 0;
  for (const character of text) {
    bytes += fitStringBytes(character);
    if (bytes > FIT_STRING_MAX_BYTES) break;
    prefix += character;
  }
  return prefix;
};
