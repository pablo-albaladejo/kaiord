// RFC 9110 §12.5.1 content negotiation for the kaiord.com edge Worker.

// The most specific matching range decides the quality.
const rangesFor = (type) => [type, `${type.split("/")[0]}/*`, "*/*"];

const qualityOf = (accept, type, { wildcards = true } = {}) => {
  const ranges = wildcards ? rangesFor(type) : [type];
  const found = new Map();
  for (const part of accept.split(",")) {
    const [media, ...params] = part.trim().split(";");
    const range = media.trim().toLowerCase();
    if (!ranges.includes(range) || found.has(range)) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    found.set(range, q ? Number(q.slice(2)) : 1);
  }
  const match = ranges.find((range) => found.has(range));
  return match ? found.get(match) : 0;
};

// Markdown only when it is asked for by name and not ranked below HTML, so a
// browser's `text/html,…,*/*` never receives it.
export function prefersMarkdown(accept) {
  const header = accept ?? "";
  const markdown = qualityOf(header, "text/markdown", { wildcards: false });
  return markdown > 0 && markdown >= qualityOf(header, "text/html");
}
