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
  const noEmbedded = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const withBreaks = noEmbedded
    .replace(/<\/(p|h[1-6]|li|div)>/gi, "$&\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
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

/**
 * Parse the `/user/details` HTML page and emit a `ZonesPayload` whose
 * fields are an explicit allowlist (defense in depth: the bridge's
 * ALLOWED grant lets the page itself be fetched, but downstream
 * consumers see only the fields below — gender, birthday, fat,
 * smoker, IMC, bpm_rest, user_notes, coach.email, coach.name, email,
 * records, tests are dropped at parse time).
 *
 * The DOM uses 0-indexed `name=` attributes (e.g. `z3_upper` is the
 * upper bound of visual Z4). The parsed payload uses 1-indexed
 * camelCase keys (`z4Upper`). This mapping is the parser's contract
 * and is asserted by tests.
 *
 * Returns:
 *   {
 *     physiological?: { weight?, bpmMax? },
 *     paces?: {
 *       cycling?: { z4Upper?, z5Lower? },
 *       running?: { z4Upper? },
 *       swimming?: { z4Upper? },
 *     },
 *     hrZones?: {
 *       cycling?: { z4Upper? },
 *       running?: { z4Upper? },
 *     },
 *   }
 */
const parsePhysioBlock = (html) => {
  const block = sliceBetween(html, /id="physio-\d+"/, "</form>");
  if (!block) return null;
  const out = {};
  const weight = extractInputValueAsNumber(block, "weight");
  const bpmMax = extractInputValueAsNumber(block, "bpm_max");
  if (typeof weight === "number") out.weight = weight;
  if (typeof bpmMax === "number") out.bpmMax = bpmMax;
  return Object.keys(out).length > 0 ? out : null;
};

const parsePacesBlock = (html) => {
  const block = sliceBetween(html, /id="paces-\d+"/, /<\/main>|<\/section>/);
  if (!block) return null;
  const out = {};
  const cycling = extractCyclingPaces(block);
  if (cycling) out.cycling = cycling;
  const running = extractMinSecPaces(block, /sport_id"[^>]+value="1"/);
  if (running) out.running = running;
  const swimming = extractMinSecPaces(block, /sport_id"[^>]+value="2"/);
  if (swimming) out.swimming = swimming;
  return Object.keys(out).length > 0 ? out : null;
};

const parseHrZonesBlock = (html) => {
  // Per-sport HR zones — sport_id is implicit on the heart-rate-zone
  // wrapper (heart-rate-zone-cycling / -running). Generic HR zone is
  // intentionally NOT emitted; we only surface per-sport mappings.
  const block = sliceBetween(html, /id="hrzones-\d+"/, /<\/main>|<\/section>/);
  if (!block) return null;
  const out = {};
  const cycling = extractHrZ4Upper(block, "cycling");
  if (typeof cycling === "number") out.cycling = { z4Upper: cycling };
  const running = extractHrZ4Upper(block, "running");
  if (typeof running === "number") out.running = { z4Upper: running };
  return Object.keys(out).length > 0 ? out : null;
};

const parseDetailsHtml = (html) => {
  if (typeof html !== "string" || html.length === 0) return {};
  const out = {};
  const physiological = parsePhysioBlock(html);
  if (physiological) out.physiological = physiological;
  const paces = parsePacesBlock(html);
  if (paces) out.paces = paces;
  const hrZones = parseHrZonesBlock(html);
  if (hrZones) out.hrZones = hrZones;
  return out;
};

const sliceBetween = (text, startPattern, endPatternOrString) => {
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

const extractInputValueAsNumber = (block, name) => {
  // Match `name="X"` followed (in either order) by `value="N"` within
  // the same <input> tag. T2G renders these in `<input ... name="weight" ... value="83">`.
  const re = new RegExp(
    `<input[^>]*\\bname="${name}"[^>]*\\bvalue="([\\d.]+)"|` +
      `<input[^>]*\\bvalue="([\\d.]+)"[^>]*\\bname="${name}"`,
    "i"
  );
  const m = block.match(re);
  if (!m) return undefined;
  const raw = m[1] ?? m[2];
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
};

// For each sport, the paces table has 5 measurement-blocks (Z1..Z5);
// each block has lower/upper inputs split into [min, sec] pairs for
// run/swim or a single integer (watts) for cycling.
//
// The form indexes them 0..4 (z0..z4); visual Z4 upper is `z3_upper`.
const Z4_UPPER_MIN_NAME = "z3_upper][0]";
const Z4_UPPER_SEC_NAME = "z3_upper][1]";
const Z5_LOWER_MIN_NAME = "z4_lower][0]";

const extractMinSecPaces = (block, sportIdPattern) => {
  // Bound the slice to a single sport's <form>...</form> block so a
  // partial sport block (e.g., running configured but no z3_upper
  // saved yet) does NOT silently consume the next sport's inputs and
  // assign the wrong threshold.
  const sportSlice = sliceWithinForm(block, sportIdPattern);
  if (!sportSlice) return null;
  const min = extractInputValueByNameSuffix(sportSlice, Z4_UPPER_MIN_NAME);
  const sec = extractInputValueByNameSuffix(sportSlice, Z4_UPPER_SEC_NAME);
  if (typeof min !== "number" || typeof sec !== "number") return null;
  return { z4Upper: { min, sec } };
};

const extractCyclingPaces = (block) => {
  const sportSlice = sliceWithinForm(block, /sport_id"[^>]+value="3"/);
  if (!sportSlice) return null;
  const z4Upper = extractInputValueByNameSuffix(sportSlice, Z4_UPPER_MIN_NAME);
  const z5Lower = extractInputValueByNameSuffix(sportSlice, Z5_LOWER_MIN_NAME);
  const out = {};
  if (typeof z4Upper === "number") out.z4Upper = z4Upper;
  if (typeof z5Lower === "number") out.z5Lower = z5Lower;
  return Object.keys(out).length > 0 ? out : null;
};

// Returns the inner content of the <form>...</form> that contains the
// matched `fromPattern`. Bounded slicing prevents pace extractors from
// leaking across sport blocks when a sport is partially configured.
const sliceWithinForm = (text, fromPattern) => {
  const m = text.match(fromPattern);
  if (!m || typeof m.index !== "number") return null;
  const after = text.slice(m.index);
  const formClose = after.indexOf("</form>");
  return formClose >= 0 ? after.slice(0, formClose) : after;
};

const extractInputValueByNameSuffix = (block, suffix) => {
  // Form names look like `measurement[z3_upper][0]`; we match by
  // suffix so the bracket-prefix and field-prefix variations are
  // tolerated. Capture the first numeric input that follows.
  const re = new RegExp(
    `\\bname="[^"]*${escapeForRegex(suffix)}"[^>]*\\bvalue="([\\d.]+)"|` +
      `\\bvalue="([\\d.]+)"[^>]*\\bname="[^"]*${escapeForRegex(suffix)}"`,
    "i"
  );
  const m = block.match(re);
  if (!m) return undefined;
  const raw = m[1] ?? m[2];
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
};

const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractHrZ4Upper = (block, sport) => {
  // The cycling/running blocks are wrapped in
  // `heart-rate-zone heart-rate-zone-<sport>`. Slice that block,
  // then read `name="z3_upper"` inside.
  const wrapperRe = new RegExp(
    `heart-rate-zone-${sport}[\\s\\S]*?(?=heart-rate-zone-(?!${sport})|<\\/section>|$)`,
    "i"
  );
  const m = block.match(wrapperRe);
  if (!m) return undefined;
  const sportBlock = m[0];
  const valRe =
    /\bname="z3_upper"[^>]*\bvalue="(\d+)"|\bvalue="(\d+)"[^>]*\bname="z3_upper"/i;
  const v = sportBlock.match(valRe);
  if (!v) return undefined;
  const raw = v[1] ?? v[2];
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
};

// Export to service worker global scope (importScripts doesn't add const to globalThis)
if (typeof self !== "undefined" && typeof module === "undefined") {
  self.parseWeeklyHtml = parseWeeklyHtml;
  self.parseDailyHtml = parseDailyHtml;
  self.parsePingJson = parsePingJson;
  self.parseDetailsHtml = parseDetailsHtml;
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
    parseDetailsHtml,
    decodeEntities,
    extractDescription,
    extractCompletion,
    htmlToPlainText,
  };
}
