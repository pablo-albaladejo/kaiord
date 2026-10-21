export const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** A fenced code block. One still open at the end (a reply mid-stream) runs
 * to the end of the source. */
export function readFence(lines: string[], i: number): [string, number] {
  const marker = FENCE.exec(lines[i] ?? "")?.[1] ?? "```";
  const close = new RegExp(`^ {0,3}${marker[0]}{${marker.length},}\\s*$`);
  let j = i + 1;
  while (j < lines.length && !close.test(lines[j] ?? "")) j++;
  const text = lines.slice(i + 1, j).join("\n");
  return [text, Math.min(j + 1, lines.length)];
}
