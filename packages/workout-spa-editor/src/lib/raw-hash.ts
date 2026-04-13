/**
 * Raw Hash Utility
 *
 * Computes a deterministic SHA-256 hash of a workout's raw payload
 * for change detection (STALE state detection).
 */

import type { WorkoutRaw } from "../types/calendar-fragments";

const sortComments = (
  comments: WorkoutRaw["comments"]
): WorkoutRaw["comments"] =>
  [...comments].sort((a, b) => {
    const timeDiff = a.timestamp.localeCompare(b.timestamp);
    if (timeDiff !== 0) return timeDiff;
    const authorDiff = a.author.localeCompare(b.author);
    if (authorDiff !== 0) return authorDiff;
    return a.text.localeCompare(b.text);
  });

const buildCanonical = (raw: WorkoutRaw): string => {
  const title = raw.title.trim();
  const description = raw.description.trim().replace(/\r\n/g, "\n");
  const sorted = sortComments(raw.comments);
  const lines = sorted.map(
    (c) => `${c.timestamp}|${c.author}|${c.text.trim()}`
  );
  return `${title}\n${description}\n${lines.join("\n")}`;
};

export const computeRawHash = async (raw: WorkoutRaw): Promise<string> => {
  const canonical = buildCanonical(raw);
  const encoded = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
