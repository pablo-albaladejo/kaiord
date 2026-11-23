export const sliceBetween = (
  text: string,
  startPattern: RegExp,
  endPatternOrString: RegExp | string
): string | null => {
  const startMatch = text.match(startPattern);
  if (!startMatch || typeof startMatch.index !== "number") return null;
  const after = text.slice(startMatch.index);
  if (typeof endPatternOrString === "string") {
    const endIdx = after.indexOf(endPatternOrString);
    return endIdx >= 0 ? after.slice(0, endIdx) : after;
  }
  const endMatch = after.match(endPatternOrString);
  return endMatch && typeof endMatch.index === "number"
    ? after.slice(0, endMatch.index)
    : after;
};

// Bounded to the enclosing `</form>` so a partially configured sport
// never consumes the next sport's inputs.
export const sliceWithinForm = (
  text: string,
  fromPattern: RegExp
): string | null => {
  const m = text.match(fromPattern);
  if (!m || typeof m.index !== "number") return null;
  const after = text.slice(m.index);
  const formClose = after.indexOf("</form>");
  return formClose >= 0 ? after.slice(0, formClose) : after;
};
