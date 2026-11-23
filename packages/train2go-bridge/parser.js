/**
 * Kaiord Train2Go Bridge — Popup Parser
 *
 * The minimum the extension still reads for itself, for its popup and its
 * Session check: who is signed in (with the coach's name and notes) and how
 * many of this week's activities are done, with their workload. Reading the
 * plan, a day, comments, zones and weight for the Kaiord App is the App's
 * Train2Go Connector (packages/workout-spa-editor/src/adapters/train2go/
 * connector). Designed for graceful degradation: never throws.
 */

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"' };

// Single-pass decode: sequential .replace() chains double-decode
// payloads like `&amp;lt;` (first pass yields `&lt;`, second yields
// `<`), which is what CodeQL's js/double-escaping flags.
const decodeEntities = (text) =>
  text.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot));/gi,
    (match, dec, hex, named) => {
      if (dec) return String.fromCharCode(Number(dec));
      if (hex) return String.fromCharCode(parseInt(hex, 16));
      return NAMED_ENTITIES[named.toLowerCase()];
    }
  );

// Repeat a replacement until the string stops changing — a single pass
// can leave new matches behind (e.g. stripping `<b>` from `<scr<b>ipt`
// re-forms `<script`).
const replaceUntilStable = (text, pattern, replacement) => {
  let prev;
  do {
    prev = text;
    text = text.replace(pattern, replacement);
  } while (text !== prev);
  return text;
};

/**
 * Count this week's activities for the popup's weekly figures.
 * Input: raw HTML string from data.replace["#workplan"]
 * Returns: array of { id, date, workload, status }
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
    const loadMatches = [
      ...cell.matchAll(/workload-default[^"]*"\s*data-value="(\d+)"/g),
    ];
    const statusMatches = [...cell.matchAll(/data-status="([^"]+)"/g)];

    for (let i = 0; i < idMatches.length; i++) {
      activities.push({
        id: Number(idMatches[i][1]),
        date,
        workload: Number(loadMatches[i]?.[1] ?? 0),
        status: Number(statusMatches[i]?.[1] ?? 0),
      });
    }
  }

  return activities;
};

/**
 * Strip HTML tags from a string, preserving paragraph and line breaks
 * as actual newlines. Use over innerHTML to keep XSS surface zero —
 * the popup renders the result inside a <pre>/textContent boundary.
 *
 * Trims trailing whitespace and collapses 3+ newlines to 2 so the
 * pre-wrap rendering isn't dominated by empty paragraphs.
 */
const htmlToPlainText = (html) => {
  if (typeof html !== "string" || html.length === 0) return "";
  // Drop script/style blocks ENTIRE — including their text content —
  // before the tag-strip pass; otherwise the inner JS/CSS leaks into
  // the popup's textContent.
  const noEmbedded = replaceUntilStable(
    html,
    /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  const withBreaks = noEmbedded
    .replace(/<\/(p|h[1-6]|li|div)>/gi, "$&\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const stripped = replaceUntilStable(withBreaks, /<[^>]+>/g, "");
  const decoded = decodeEntities(stripped);
  return decoded
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Parse ping JSON response.
 *
 * Input: parsed JSON from /api/v2/profile/ping
 * Returns: { sessionActive, userId?, userName?, coachName?, notes? }.
 *
 * The coach/trainer name is opportunistically extracted from common
 * shapes Train2Go has historically used (`data.user.coach.name`,
 * `data.user.trainer.name`, `data.user.coach_name`,
 * `data.user.trainer_name`). If none is present the field is omitted —
 * the popup hides the sub-line gracefully.
 *
 * `notes` mirrors `data.user.user_notes` (the trainer's free-text
 * notes about the trainee) stripped to plain text so the popup can
 * render it via textContent without an XSS surface. Empty → omitted.
 *
 * Per spec we MUST NOT add a new endpoint; this parser change does
 * not touch the network.
 */
const parsePingJson = (json) => {
  if (!json?.success || !json?.data?.user) {
    return { sessionActive: false };
  }

  const user = json.data.user;
  const coachName =
    user.coach?.name ??
    user.trainer?.name ??
    user.coach_name ??
    user.trainer_name ??
    undefined;

  const notes = htmlToPlainText(user.user_notes ?? "");

  return {
    userId: user.id,
    userName: user.name,
    sessionActive: true,
    ...(typeof coachName === "string" && coachName.length > 0
      ? { coachName }
      : {}),
    ...(notes.length > 0 ? { notes } : {}),
  };
};

// Export to service worker global scope (importScripts doesn't add const to globalThis)
if (typeof self !== "undefined" && typeof module === "undefined") {
  self.parseWeeklyHtml = parseWeeklyHtml;
  self.parsePingJson = parsePingJson;
  self.decodeEntities = decodeEntities;
}

// Exported for testing (Node.js / vitest)
if (typeof module !== "undefined") {
  module.exports = {
    parseWeeklyHtml,
    parsePingJson,
    decodeEntities,
    htmlToPlainText,
  };
}
