/**
 * Kaiord Train2Go Bridge — HTML Parser
 *
 * Extracts structured activity data from Train2Go HTML fragments.
 * Designed for graceful degradation: returns empty arrays on malformed HTML.
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

  // Split on activity boundaries to extract descriptions. T2G's
  // daily HTML labels each activity wrapper with
  // `activity activity-{level}` where `{level}` mirrors the workload
  // intensity (default | low | medium | high). The previous regex
  // only matched `-default` and therefore failed to split blocks for
  // any other intensity, leaving `extractDescription("")` to return
  // `""` even when the response carried a populated description.
  // Loosened to match any `activity-<word>` suffix so all intensity
  // levels split correctly.
  const activityBlocks = html.split(/class="activity activity-\w+/);

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

// Convert a single `<a href="URL">label</a>` to markdown `[label](url)`
// BEFORE the strip-all pass so the URL survives (T2G ships anchors that
// the strip-all below would otherwise reduce to bare label text). An
// anchor with no `href`, or with empty label text, contributes only its
// plain-text label. The `href` is decoded later by the shared
// `decodeEntities` pass, so `&amp;` query separators become `&`.
const anchorToMarkdown = (_match, attrs, inner) => {
  const href = attrs.match(/\bhref\s*=\s*"([^"]*)"/i)?.[1];
  // Strip nested tags from the label with the looped strip — a single
  // `.replace()` pass can leave a re-formed tag behind (e.g. `<scr<b>ipt`
  // -> `<script`), which CodeQL flags as incomplete sanitization.
  const label = replaceUntilStable(inner, /<[^>]+>/g, "").trim();
  return href && label ? `[${label}](${href})` : label;
};

// Shared HTML-fragment → plain-text pipeline for both activity
// descriptions and comment bodies. Preserves `<strong>` as `**`,
// `<a href>` as `[label](url)`, and break/block tags as newlines;
// strips every other tag. Callers strip fragment-specific wrappers
// (SVGs, the trailing `activity-hint-ecos` div) BEFORE calling.
const htmlFragmentToText = (fragment) => {
  let text = fragment.replace(/<strong>([^<]*)<\/strong>/g, "**$1**");
  // `<\/a\s*>` (not `<\/a>`) tolerates whitespace before the closing
  // bracket so both compact server HTML and pretty-printed fixtures
  // (which wrap the tag as `</a\n>`) convert correctly.
  text = text.replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, anchorToMarkdown);
  // Convert breaks and block-level tags to newlines BEFORE stripping
  // remaining HTML. Without `<li>`/`</li>`/`</p>` conversion the live
  // single-line T2G shape `<p>title</p><ul><li>a</li><li>b</li></ul>`
  // collapses to `titleab` after strip-all (user-reported regression).
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|h[1-6]|li|ul|ol)>/gi, "\n");
  text = text.replace(/<(p|li)\b[^>]*>/gi, "\n");
  text = replaceUntilStable(text, /<[^>]+>/g, "");
  text = decodeEntities(text);
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l)
    .join("\n");
};

const extractDescription = (block) => {
  // The lookahead boundary MUST stop at the start of the next sibling
  // tag (the `<div class="activity-hint-ecos ...">` block, or the form
  // / aside close), not at the substring "activity-hint-ecos" — otherwise
  // the captured chunk includes the partial opening `<div class="` and
  // leaks it into the rendered description (the trailing tag has no `>`
  // so the strip-divs-with-content regex below never matches it).
  const descMatch = block.match(
    /activity-description[^>]*>([\s\S]*?)(?=<div[^>]*activity-hint-ecos|<\/form>|<\/aside>|$)/
  );
  if (!descMatch) return "";

  let text = descMatch[1];
  // Remove SVGs and nested elements
  text = text.replace(/<svg[\s\S]*?<\/svg>/g, "");
  // CAUTION: this strips ANY balanced <div>...</div> block — content
  // and all — which is intentional for the trailing
  // `activity-hint-ecos` div but would also eat bullets if Train2Go
  // ever wrapped them in <div> instead of <ul><li>. Bullets currently
  // arrive as <ul><li>, so we mirror htmlToPlainText's pattern (convert
  // closing block-level tags to "\n" BEFORE strip-all) to preserve the
  // line break that <li> implies.
  text = text.replace(/<div[\s\S]*?<\/div>/g, "");
  return htmlFragmentToText(text);
};

const extractCompletion = (block) => {
  const pctMatch = block.match(/class="percent[^"]*"[^>]*>\s*(\d+)%/);
  return pctMatch ? Number(pctMatch[1]) : 0;
};

/**
 * Parse the day-scoped comment thread from the daily workplan HTML.
 *
 * Comments live in the `div.comments` block of the daily sidebar's right
 * column. Each `<div class="comment">` yields:
 *   - author    (from the avatar `<picture title="...">`)
 *   - isOwn     (the viewer's own comments carry a delete button whose
 *                `data-remote` targets `/api/v2/comments/{id}`)
 *   - timestamp (verbatim `<time datetime="...">`)
 *   - text      (body after `</time>`, via the shared description pipeline)
 *
 * Returns [] when there is no comments block. Malformed entries (no
 * `<time>`) are skipped. Avatar image URLs are never emitted.
 */
const extractComments = (html) => {
  if (!html || typeof html !== "string") return [];

  const comments = [];
  // `class="comment"` (closing quote right after `comment`) uniquely
  // identifies a comment wrapper — it does NOT match the container
  // `class="comments "`. The first chunk is everything before the first
  // comment; skip it.
  const blocks = html.split(/<div class="comment"/);
  for (const block of blocks.slice(1)) {
    const dt = block.match(/<time[^>]*\bdatetime="([^"]*)"/);
    // `\s*` before the closing bracket tolerates pretty-printed HTML
    // (`</time\n>`) as well as compact server output.
    const close = block.match(/<\/time\s*>/);
    if (!dt || !close || close.index === undefined) continue; // malformed

    // Metadata lives BEFORE the timestamp (avatar picture + the delete
    // button on own comments); the body lives AFTER it.
    const head = block.slice(0, close.index);
    const author = head.match(/<picture[^>]*\btitle="([^"]*)"/)?.[1] ?? "";
    const isOwn = /data-remote="[^"]*\/api\/v2\/comments\/\d/.test(head);

    const afterTime = block.slice(close.index + close[0].length);
    const bodyEnd = afterTime.search(/<\/div\s*>/);
    const bodyHtml = bodyEnd >= 0 ? afterTime.slice(0, bodyEnd) : afterTime;

    comments.push({
      author: decodeEntities(author),
      isOwn,
      timestamp: dt[1],
      text: htmlFragmentToText(bodyHtml),
    });
  }

  return comments;
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

/**
 * Parse the `/user/details` HTML page and emit a `ZonesPayload` whose
 * fields are an explicit allowlist (defense in depth: the bridge's
 * ALLOWED grant lets the page itself be fetched, but downstream
 * consumers see only the fields below — gender, birthday, fat,
 * smoker, imc, user_notes, coach.email, coach.name, email, records,
 * tests are dropped at parse time).
 *
 * The DOM uses 0-indexed `name=` attributes (e.g. `z3_upper` is the
 * upper bound of visual Z4). The parsed payload uses 1-indexed
 * camelCase keys (`z4.upper`, `z4Upper`). This mapping is the
 * parser's contract and is asserted by tests.
 *
 * Returns:
 *   {
 *     physiological?: { weight?, bpmMax?, bpmRest? },
 *     paces?: {
 *       cycling?: { z1..z5: { lower, upper }, z4Upper?, z5Lower? },
 *       running?: { z1..z5: { lower:{min,sec}, upper:{min,sec} }, z4Upper? },
 *       swimming?: { z1..z5: { lower:{min,sec}, upper:{min,sec} }, z4Upper? },
 *     },
 *     hrZones?: {
 *       generic?:  { z1..z5: { lower, upper } },
 *       cycling?:  { z1..z5: { lower, upper }, z4Upper? },
 *       running?:  { z1..z5: { lower, upper }, z4Upper? },
 *       swimming?: { z1..z5: { lower, upper }, z4Upper? },
 *     },
 *   }
 *
 * Naming pun: payload.paces.cycling carries WATTS (single integer
 * per bound), not pace. T2G's HTML form is named `paces` for all
 * three sports; we keep the name to mirror the form id. The semantic
 * flip from "pace" → "power" happens in the SPA mapper, not here.
 */
const parsePhysioBlock = (html) => {
  const block = sliceBetween(html, /id="physio-\d+"/, "</form>");
  if (!block) return null;
  const out = {};
  const weight = extractInputValueAsNumber(block, "weight");
  const bpmMax = extractInputValueAsNumber(block, "bpm_max");
  const bpmRest = extractInputValueAsNumber(block, "bpm_rest");
  if (typeof weight === "number") out.weight = weight;
  if (typeof bpmMax === "number") out.bpmMax = bpmMax;
  if (typeof bpmRest === "number") out.bpmRest = bpmRest;
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
  // Sport-specific blocks (cycling/running/swimming) live INSIDE the
  // per-user `<div id="hrzones-{id}">` container; the Generic block
  // is rendered as a SIBLING under <section class="pupil-details">
  // and ends up OUTSIDE that container. We therefore parse Generic
  // from the full HTML and the sport-specific blocks from the
  // narrower slice. extractHrFullBands' lazy regex is self-anchored
  // on `heart-rate-zone-generic` and stops at the next
  // `heart-rate-zone-X` or `</section>`, so it can't bleed into the
  // sport-specific blocks. The SPA mapper applies a Specific →
  // Generic → skip fallback per D-FB1. HTML comments are stripped
  // first so prose mentions of zone class names (e.g. fixture
  // headers) cannot anchor the wrapper regex.
  const stripped = replaceUntilStable(html, /<!--[\s\S]*?-->/g, "");
  const block = sliceBetween(
    stripped,
    /id="hrzones-\d+"/,
    /<\/main>|<\/section>/
  );
  const out = {};
  const generic = extractHrFullBands(stripped, "generic");
  if (generic) out.generic = generic;
  if (block) {
    for (const sport of ["cycling", "running", "swimming"]) {
      const bands = extractHrFullBands(block, sport);
      if (bands) out[sport] = bands;
    }
  }
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

// For each sport, the paces table has 5 measurement-blocks. The DOM
// indexes them 0..4 (`z0_lower` .. `z4_upper`); visual Z1..Z5 maps
// 1-indexed in the payload. Run/swim bands are `[min, sec]` pairs;
// cycling bands are single watts integers.

// The five DOM index names; payload key is `zN+1` (1-indexed).
const DOM_BAND_INDEXES = [0, 1, 2, 3, 4];

const extractMinSecPaces = (block, sportIdPattern) => {
  // Bound the slice to a single sport's <form>...</form> block so a
  // partial sport block (e.g., running configured but no z3_upper
  // saved yet) does NOT silently consume the next sport's inputs and
  // assign the wrong threshold.
  const sportSlice = sliceWithinForm(block, sportIdPattern);
  if (!sportSlice) return null;
  const out = {};
  for (const i of DOM_BAND_INDEXES) {
    const lowerMin = extractInputValueByNameSuffix(
      sportSlice,
      `z${i}_lower][0]`
    );
    const lowerSec = extractInputValueByNameSuffix(
      sportSlice,
      `z${i}_lower][1]`
    );
    const upperMin = extractInputValueByNameSuffix(
      sportSlice,
      `z${i}_upper][0]`
    );
    const upperSec = extractInputValueByNameSuffix(
      sportSlice,
      `z${i}_upper][1]`
    );
    if (
      typeof lowerMin === "number" &&
      typeof lowerSec === "number" &&
      typeof upperMin === "number" &&
      typeof upperSec === "number"
    ) {
      out[`z${i + 1}`] = {
        lower: { min: lowerMin, sec: lowerSec },
        upper: { min: upperMin, sec: upperSec },
      };
    }
  }
  // Convenience scalar (visual Z4 upper, DOM z3_upper). When the z4
  // band is complete, derive from `out.z4.upper` for consistency.
  // When the band is partial (e.g., only z3_upper saved), fall back
  // to direct DOM extraction so backwards-compat with older fixtures
  // and partial coach configurations keeps working.
  if (out.z4) {
    out.z4Upper = out.z4.upper;
  } else {
    const directMin = extractInputValueByNameSuffix(sportSlice, `z3_upper][0]`);
    const directSec = extractInputValueByNameSuffix(sportSlice, `z3_upper][1]`);
    if (typeof directMin === "number" && typeof directSec === "number") {
      out.z4Upper = { min: directMin, sec: directSec };
    }
  }
  return Object.keys(out).length > 0 ? out : null;
};

const extractCyclingPaces = (block) => {
  // Cycling pace block carries WATTS, not min:sec — single integer
  // per bound. The naming pun (`paces.cycling` for watts) is
  // intentional: T2G's HTML form id is shared across sports.
  const sportSlice = sliceWithinForm(block, /sport_id"[^>]+value="3"/);
  if (!sportSlice) return null;
  const out = {};
  for (const i of DOM_BAND_INDEXES) {
    const lower = extractInputValueByNameSuffix(sportSlice, `z${i}_lower][0]`);
    const upper = extractInputValueByNameSuffix(sportSlice, `z${i}_upper][0]`);
    if (typeof lower === "number" && typeof upper === "number") {
      out[`z${i + 1}`] = { lower, upper };
    }
  }
  // Convenience scalars: visual Z4 upper (DOM z3_upper) is FTP;
  // visual Z5 lower (DOM z4_lower) is the FTP fallback per D5 of the
  // original change. When the corresponding band is complete, derive
  // from the band; otherwise fall back to direct DOM extraction so
  // partially-configured forms still surface the threshold scalars.
  if (out.z4) {
    out.z4Upper = out.z4.upper;
  } else {
    const direct = extractInputValueByNameSuffix(sportSlice, `z3_upper][0]`);
    if (typeof direct === "number") out.z4Upper = direct;
  }
  if (out.z5) {
    out.z5Lower = out.z5.lower;
  } else {
    const direct = extractInputValueByNameSuffix(sportSlice, `z4_lower][0]`);
    if (typeof direct === "number") out.z5Lower = direct;
  }
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

const extractHrFullBands = (block, label) => {
  // The HR zone blocks are wrapped in
  // `heart-rate-zone heart-rate-zone-<label>` where <label> is one
  // of: generic, cycling, running, swimming. Slice the matching
  // wrapper, then read each `name="zN_lower"` / `name="zN_upper"`
  // pair inside (DOM 0-indexed N=0..4 → payload 1-indexed Z1..Z5).
  // Returns null when the wrapper is absent (the block is omitted).
  const wrapperRe = new RegExp(
    `heart-rate-zone-${label}[\\s\\S]*?(?=heart-rate-zone-(?!${label})|<\\/section>|$)`,
    "i"
  );
  const m = block.match(wrapperRe);
  if (!m) return null;
  const sportBlock = m[0];
  const out = {};
  for (const i of DOM_BAND_INDEXES) {
    const lower = extractHrBandValue(sportBlock, `z${i}_lower`);
    const upper = extractHrBandValue(sportBlock, `z${i}_upper`);
    if (typeof lower === "number" && typeof upper === "number") {
      out[`z${i + 1}`] = { lower, upper };
    }
  }
  // Convenience scalar (visual Z4 upper, DOM z3_upper). Derive from
  // the band when complete; otherwise fall back to direct DOM
  // extraction so partial blocks still surface LTHR.
  if (out.z4) {
    out.z4Upper = out.z4.upper;
  } else {
    const direct = extractHrBandValue(sportBlock, "z3_upper");
    if (typeof direct === "number") out.z4Upper = direct;
  }
  return Object.keys(out).length > 0 ? out : null;
};

const extractHrBandValue = (sportBlock, name) => {
  const valRe = new RegExp(
    `\\bname="${name}"[^>]*\\bvalue="(\\d+)"|\\bvalue="(\\d+)"[^>]*\\bname="${name}"`,
    "i"
  );
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
  self.extractComments = extractComments;
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
    extractComments,
    htmlToPlainText,
  };
}
