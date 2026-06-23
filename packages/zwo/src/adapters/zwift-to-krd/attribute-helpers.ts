// XML-edge utility: fast-xml-parser prefixes every attribute with "@_". This
// strips that prefix so the domain dispatch reads plain KRD/Zwift field names.
export const normalizeAttributeNames = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.startsWith("@_") ? key.substring(2) : key;
    normalized[normalizedKey] = value;
  }
  return normalized;
};
