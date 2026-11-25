import { extractCompletion, extractDescription } from "./daily-activity-block";
import { decodeEntities } from "./decode-entities";
import { parseSessionSteps } from "./parse-session-steps";
import type { Train2GoActivity } from "./train2go-wire-types";

const collectMatches = (html: string) => ({
  ids: [...html.matchAll(/data-id="(\d+)"/g)],
  sports: [...html.matchAll(/icon-sports(\w+)/g)],
  titles: [
    ...html.matchAll(/activity-title[^>]*>\s*<strong>([^<]+)<\/strong>/g),
  ],
  measured: [...html.matchAll(/class="measured">([^<]+)</g)],
  loads: [...html.matchAll(/workload-default[^"]*"\s*data-value="(\d+)"/g)],
  statuses: [...html.matchAll(/data-status="([^"]+)"/g)],
});

export const parseDailyHtml = (html: unknown): Train2GoActivity[] => {
  if (!html || typeof html !== "string") return [];
  const m = collectMatches(html);
  // Wrappers are `activity activity-{level}` with level = workload
  // intensity (default | low | medium | high); match any level.
  const activityBlocks = html.split(/class="activity activity-\w+/);

  return m.titles.map((titleMatch, i) => {
    const block = activityBlocks[i + 1] ?? "";
    const steps = parseSessionSteps(block);
    return {
      id: Number(m.ids[i]?.[1] ?? 0),
      date: "",
      sport: m.sports[i]?.[1] ?? "unknown",
      title: decodeEntities(titleMatch[1] ?? ""),
      duration: m.measured[i]?.[1]?.trim() ?? "",
      workload: Number(m.loads[i]?.[1] ?? 0),
      status: Number(m.statuses[i]?.[1] ?? 0),
      description: extractDescription(block),
      completion: extractCompletion(block),
      ...(steps ? { steps } : {}),
    };
  });
};
