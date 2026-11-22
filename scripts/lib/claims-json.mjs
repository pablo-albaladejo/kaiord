// The units of a JSON surface. With `keys`, the text at each named key: a
// string, or the `message` of an object (the shape of a Chrome
// `_locales/*/messages.json`). Without `keys`, every string value the file
// holds (a translation file maps source text to what the reader sees, so its
// object keys are never shown and never units).

const normalize = (text) => text.replace(/\s+/g, " ").trim();

const stringValues = (value) => {
  if (typeof value === "string") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringValues);
};

// A dotted key walks into nested objects ("es.title"). An empty text is as
// missing as an absent one: it never registers an empty claim.
const shownAt = (data, key) => {
  const value = key.split(".").reduce((node, part) => node?.[part], data);
  const text = typeof value === "string" ? value : value?.message;
  return typeof text === "string" && text.trim() ? text : undefined;
};

export const jsonUnits = (surface, src) => {
  let data;
  try {
    data = JSON.parse(src);
  } catch {
    return { error: `${surface.file}: not valid JSON` };
  }
  if (!surface.keys)
    return { units: stringValues(data).map(normalize).filter(Boolean) };
  const missing = surface.keys.filter(
    (key) => typeof shownAt(data, key) !== "string"
  );
  if (missing.length > 0)
    return { error: `${surface.file}: key(s) ${missing.join(", ")} missing` };
  return { units: surface.keys.map((key) => normalize(shownAt(data, key))) };
};
