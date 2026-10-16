// XML-edge utility: fast-xml-parser prefixes every attribute with "@_". This
// strips that prefix so the domain dispatch reads plain KRD/Zwift field names.
const stripPrefixes = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.startsWith("@_") ? key.substring(2) : key;
    normalized[normalizedKey] = value;
  }
  return normalized;
};

// <textevent> children carry their own attributes (message, timeoffset), so
// they need the same treatment as the interval element itself.
const normalizeTextEvents = (textevent: unknown): unknown => {
  if (Array.isArray(textevent)) {
    return textevent.map((event) => normalizeTextEvents(event));
  }
  return textevent && typeof textevent === "object"
    ? stripPrefixes(textevent as Record<string, unknown>)
    : textevent;
};

export const normalizeAttributeNames = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const normalized = stripPrefixes(data);
  if (normalized.textevent !== undefined) {
    normalized.textevent = normalizeTextEvents(normalized.textevent);
  }
  return normalized;
};
