/**
 * Kaiord Bridge Core — Popup Shell Renderers (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-popup-shell.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * The blocks every bridge popup is built from: the status block
 * (dot + verdict + one cause sentence), the capability chips, the
 * consequence lines, the fixed-height checking skeleton, and the CTA pair.
 * Loaded from popup.html right after bridge-popup-utils.js.
 *
 * `$` and `msg` are passed in rather than closed over: at runtime they are
 * page globals contributed by bridge-popup-utils.js, and passing them keeps
 * every renderer callable from a CJS `require` in the bridge test suites.
 */

// The second line keeps `--line` (height) and adds `--line-short` (width);
// the width modifier alone would render a zero-height bar.
const KD_SKELETON_LINES = [
  "skeleton--line",
  "skeleton--line skeleton--line-short",
];

const kdReplace = (region, nodes) => {
  region.innerHTML = "";
  for (const node of nodes) region.appendChild(node);
};

const kdBlock = (tag, className, text) => {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

// tone ∈ {ok, warn, muted} — colours the dot and the verdict. `causeKey`
// is optional: a state with no explainable cause renders the verdict alone
// and hides the cause line rather than leaving a stale sentence behind.
//
// Deliberately sets no aria-label on the block: an aria-label would replace
// its content for assistive tech, announcing the verdict and swallowing the
// cause. The block is a polite live region, so both lines are read.
const renderStatusBlock = (
  $,
  msg,
  { tone = "muted", verdictKey, verdictSubs, causeKey, causeSubs } = {}
) => {
  const el = $("status");
  el.className = `status-block status-block--${tone}`;
  $("status-text").textContent = msg(verdictKey, verdictSubs);
  const cause = $("status-sub");
  if (!cause) return;
  cause.textContent = causeKey ? msg(causeKey, causeSubs) : "";
  cause.hidden = !causeKey;
};

// items: [{ label, modifier? }] — modifier is a `.chip--*` suffix
// ("out", "muted", "dashed", "danger"). An empty list clears the region.
const renderChips = ($, items, { caption, region = "chips-region" } = {}) => {
  const host = $(region);
  const nodes = [];
  if (items.length > 0) {
    if (caption) nodes.push(kdBlock("div", "caption", caption));
    const list = kdBlock("div", "chips");
    for (const { label, modifier } of items) {
      const cls = modifier ? `chip chip--${modifier}` : "chip";
      list.appendChild(kdBlock("span", cls, label));
    }
    nodes.push(list);
  }
  kdReplace(host, nodes);
};

// lines: [string] — one fact per line, rendered as its own paragraph so the
// block reads as separate consequences rather than one run-on sentence. An
// empty list clears the region.
//
// The region is optional: a popup that declares no consequence region is left
// untouched rather than throwing, so this renderer can ship to every bridge
// ahead of the copy that fills it.
const renderConsequence = (
  $,
  lines,
  { region = "consequence-region" } = {}
) => {
  const host = $(region);
  if (!host) return;
  if (lines.length === 0) {
    kdReplace(host, []);
    return;
  }
  const box = kdBlock("div", "consequence");
  for (const line of lines) {
    box.appendChild(kdBlock("p", "consequence__line", line));
  }
  kdReplace(host, [box]);
};

// Placeholders sized to the resolved layout (caption, three chips, two text
// lines, one CTA) so the popup does not jump when the probe settles.
const renderSkeleton = ($) => {
  const chips = kdBlock("div", "chips");
  for (let i = 0; i < 3; i += 1) {
    chips.appendChild(kdBlock("span", "skeleton skeleton--chip"));
  }
  kdReplace($("chips-region"), [
    kdBlock("div", "skeleton skeleton--caption"),
    chips,
  ]);
  kdReplace($("footer-region"), [
    ...KD_SKELETON_LINES.map((cls) => kdBlock("div", `skeleton ${cls}`)),
    kdBlock("div", "skeleton skeleton--cta"),
  ]);
};

const kdLink = (className, label, href) => {
  const a = document.createElement("a");
  a.className = className;
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = label;
  a.setAttribute("aria-label", label);
  return a;
};

// The primary CTA is whatever fixes the current state: signing back in when
// the session is broken, opening the editor when everything flows.
const renderCtas = (
  $,
  { primaryLabel, primaryHref, secondaryLabel, secondaryHref }
) => {
  const nodes = [kdLink("cta-primary", primaryLabel, primaryHref)];
  if (secondaryLabel && secondaryHref) {
    nodes.push(kdLink("cta-secondary", secondaryLabel, secondaryHref));
  }
  kdReplace($("footer-region"), nodes);
};

if (typeof module !== "undefined") {
  module.exports = {
    renderStatusBlock,
    renderChips,
    renderConsequence,
    renderSkeleton,
    renderCtas,
  };
}
