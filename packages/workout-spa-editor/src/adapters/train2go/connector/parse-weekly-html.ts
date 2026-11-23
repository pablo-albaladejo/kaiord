import { decodeEntities } from "./decode-entities";
import type { Train2GoActivity } from "./train2go-wire-types";

const IGNORED_TITLE_PREFIXES = [
  "Mark",
  "Create",
  "Select",
  "Deselect",
  "April",
  "Save",
];

const isActivityTitle = (t: string): boolean =>
  !IGNORED_TITLE_PREFIXES.some((prefix) => t.startsWith(prefix));

const parseDayCell = (cell: string): Train2GoActivity[] => {
  const dateMatch = cell.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return [];
  const date = dateMatch[1] ?? "";

  const idMatches = [...cell.matchAll(/data-id="(\d+)"/g)];
  const sportMatches = [...cell.matchAll(/icon-sports(\w+)/g)];
  const titleMatches = [...cell.matchAll(/title="([^"]{2,})"/g)];
  const measuredMatches = [...cell.matchAll(/class="measured">([^<]+)</g)];
  const loadMatches = [
    ...cell.matchAll(/workload-default[^"]*"\s*data-value="(\d+)"/g),
  ];
  const statusMatches = [...cell.matchAll(/data-status="([^"]+)"/g)];
  const titles = titleMatches.map((m) => m[1] ?? "").filter(isActivityTitle);

  return idMatches.map((idMatch, i) => ({
    id: Number(idMatch[1]),
    date,
    sport: sportMatches[i]?.[1] ?? "unknown",
    title: decodeEntities(titles[i] ?? ""),
    duration: measuredMatches[i]?.[1]?.trim() ?? "",
    workload: Number(loadMatches[i]?.[1] ?? 0),
    status: Number(statusMatches[i]?.[1] ?? 0),
  }));
};

export const parseWeeklyHtml = (html: unknown): Train2GoActivity[] => {
  if (!html || typeof html !== "string") return [];
  const cells = html.split(
    /workplan-table-block workplan-table-day workplan-table-date-/
  );
  return cells.slice(1).flatMap(parseDayCell);
};
