/**
 * Kaiord Train2Go Bridge — HTML Parser
 *
 * Extracts structured activity data from Train2Go HTML fragments.
 * Designed for graceful degradation: returns empty arrays on malformed HTML.
 */

const decodeEntities = (text) =>
  text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");

const extractNumber = (text) => {
  const m = text?.match(/\d+/);
  return m ? Number(m[0]) : 0;
};

/**
 * Parse weekly workplan HTML fragment.
 * Input: raw HTML string from data.replace["#workplan"]
 * Returns: array of { id, date, sport, title, duration, workload, status }
 */
const parseWeeklyHtml = (html) => {
  if (!html || typeof html !== "string") return [];

  const activities = [];
  const cells = html.split(
    /workplan-table-block workplan-table-day workplan-table-date-/
  );

  for (const cell of cells.slice(1)) {
    const dateMatch = cell.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    const date = dateMatch[1];

    const idMatches = [...cell.matchAll(/data-id="(\d+)"/g)];
    const sportMatches = [...cell.matchAll(/icon-sports(\w+)/g)];
    const titleMatches = [...cell.matchAll(/title="([^"]{2,})"/g)];
    const measuredMatches = [...cell.matchAll(/class="measured">([^<]+)</g)];
    const loadMatches = [
      ...cell.matchAll(/workload-default[^"]*"\s*data-value="(\d+)"/g),
    ];
    const statusMatches = [...cell.matchAll(/data-status="([^"]+)"/g)];

    const titles = titleMatches
      .map((m) => m[1])
      .filter(
        (t) =>
          !t.startsWith("Mark") &&
          !t.startsWith("Create") &&
          !t.startsWith("Select") &&
          !t.startsWith("Deselect") &&
          !t.startsWith("April") &&
          !t.startsWith("Save")
      );

    for (let i = 0; i < idMatches.length; i++) {
      activities.push({
        id: Number(idMatches[i][1]),
        date,
        sport: sportMatches[i]?.[1] ?? "unknown",
        title: decodeEntities(titles[i] ?? ""),
        duration: measuredMatches[i]?.[1]?.trim() ?? "",
        workload: Number(loadMatches[i]?.[1] ?? 0),
        status: Number(statusMatches[i]?.[1] ?? 0),
      });
    }
  }

  return activities;
};

/**
 * Parse daily workplan HTML fragment.
 * Input: raw HTML string from data.content
 * Returns: array of activity objects with description + completion
 */
const parseDailyHtml = (html) => {
  if (!html || typeof html !== "string") return [];

  const activities = [];
  const idMatches = [...html.matchAll(/data-id="(\d+)"/g)];
  const sportMatches = [...html.matchAll(/icon-sports(\w+)/g)];
  const titleMatches = [
    ...html.matchAll(/activity-title[^>]*>\s*<strong>([^<]+)<\/strong>/g),
  ];
  const measuredMatches = [...html.matchAll(/class="measured">([^<]+)</g)];
  const loadMatches = [
    ...html.matchAll(/workload-default[^"]*"\s*data-value="(\d+)"/g),
  ];
  const statusMatches = [...html.matchAll(/data-status="([^"]+)"/g)];

  // Split on activity boundaries to extract descriptions
  const activityBlocks = html.split(/class="activity activity-default/);

  for (let i = 0; i < titleMatches.length; i++) {
    const block = activityBlocks[i + 1] ?? "";
    const description = extractDescription(block);
    const completion = extractCompletion(block);

    activities.push({
      id: Number(idMatches[i]?.[1] ?? 0),
      date: "",
      sport: sportMatches[i]?.[1] ?? "unknown",
      title: decodeEntities(titleMatches[i][1]),
      duration: measuredMatches[i]?.[1]?.trim() ?? "",
      workload: Number(loadMatches[i]?.[1] ?? 0),
      status: Number(statusMatches[i]?.[1] ?? 0),
      description,
      completion,
    });
  }

  return activities;
};

const extractDescription = (block) => {
  const descMatch = block.match(
    /activity-description[^>]*>([\s\S]*?)(?=activity-hint-ecos|<\/form>|<\/aside>|$)/
  );
  if (!descMatch) return "";

  let text = descMatch[1];
  // Remove SVGs and nested elements
  text = text.replace(/<svg[\s\S]*?<\/svg>/g, "");
  text = text.replace(/<div[\s\S]*?<\/div>/g, "");
  // Preserve bold markers
  text = text.replace(/<strong>([^<]*)<\/strong>/g, "**$1**");
  // Convert breaks and paragraphs to newlines
  text = text.replace(/<br\s*\/?>/g, "\n");
  text = text.replace(/<p>/g, "\n");
  // Strip remaining HTML
  text = text.replace(/<[^>]+>/g, "");
  text = decodeEntities(text);
  // Clean up whitespace
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l)
    .join("\n");
};

const extractCompletion = (block) => {
  const pctMatch = block.match(/class="percent[^"]*"[^>]*>\s*(\d+)%/);
  return pctMatch ? Number(pctMatch[1]) : 0;
};

/**
 * Parse ping JSON response.
 * Input: parsed JSON from /api/v2/profile/ping
 * Returns: { userId, userName, sessionActive } or null
 */
const parsePingJson = (json) => {
  if (!json?.success || !json?.data?.user) {
    return { sessionActive: false };
  }

  const user = json.data.user;
  return {
    userId: user.id,
    userName: user.name,
    sessionActive: true,
  };
};

// Export to service worker global scope (importScripts doesn't add const to globalThis)
if (typeof self !== "undefined" && typeof module === "undefined") {
  self.parseWeeklyHtml = parseWeeklyHtml;
  self.parseDailyHtml = parseDailyHtml;
  self.parsePingJson = parsePingJson;
  self.decodeEntities = decodeEntities;
  self.extractDescription = extractDescription;
  self.extractCompletion = extractCompletion;
}

// Exported for testing (Node.js / vitest)
if (typeof module !== "undefined") {
  module.exports = {
    parseWeeklyHtml,
    parseDailyHtml,
    parsePingJson,
    decodeEntities,
    extractDescription,
    extractCompletion,
  };
}
