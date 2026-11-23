const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
};

// Single pass on purpose: chained `.replace()` calls would double-decode
// payloads like `&amp;lt;` into `<`.
export const decodeEntities = (text: string): string =>
  text.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot));/gi,
    (
      match: string,
      dec: string | undefined,
      hex: string | undefined,
      named: string | undefined
    ) => {
      if (dec) return String.fromCharCode(Number(dec));
      if (hex) return String.fromCharCode(parseInt(hex, 16));
      return NAMED_ENTITIES[(named ?? "").toLowerCase()] ?? match;
    }
  );
