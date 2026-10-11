// `parseAttributeValue` and `parseTagValue` coerce every numeric-looking value
// (a step named "30", a message "1") to a number. fast-xml-parser skips that
// coercion when a value processor returns null, so free-text fields stay
// strings while Duration, Power, timeoffset and the like are still numbers.
const TEXT_ATTRIBUTES = new Set([
  "message",
  "name",
  "kaiord:name",
  "kaiord:onName",
  "kaiord:offName",
  "kaiord:manufacturer",
  "kaiord:product",
  "kaiord:serialNumber",
]);

const TEXT_TAGS = new Set(["author", "name", "description", "tag"]);

export const keepTextAttribute = (
  attributeName: string,
  value: string
): string | null => (TEXT_ATTRIBUTES.has(attributeName) ? null : value);

export const keepTextTag = (tagName: string, value: string): string | null =>
  TEXT_TAGS.has(tagName) ? null : value;
