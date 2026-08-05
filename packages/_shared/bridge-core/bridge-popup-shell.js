/**
 * Kaiord Bridge Core — Popup Shell Renderers (vendored)
 *
 * Master: packages/_shared/bridge-core/bridge-popup-shell.js. Never edit a
 * vendored copy — edit the master and run `pnpm bridge:sync`.
 *
 * The blocks every bridge popup is built from: the status block
 * (mark + verdict + one cause sentence), the capability chips, the
 * consequence lines, the fixed-height checking skeleton, and the CTA pair.
 * Loaded from popup.html right after bridge-popup-utils.js.
 *
 * `$` and `msg` are passed in rather than closed over: at runtime they are
 * page globals contributed by bridge-popup-utils.js, and passing them keeps
 * every renderer callable from a CJS `require` in the bridge test suites.
 */

const KD_SVG_NS = "http://www.w3.org/2000/svg";

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

// Sprite reference rather than inline path data: each popup.html carries the
// symbol set, so a master never has to hold geometry it would then have to
// keep in sync with five copies.
const kdIcon = (className, symbolId) => {
  const svg = document.createElementNS(KD_SVG_NS, "svg");
  svg.setAttribute("class", className);
  const use = document.createElementNS(KD_SVG_NS, "use");
  use.setAttribute("href", `#${symbolId}`);
  svg.appendChild(use);
  return svg;
};

// The mark is the leading glyph of the status block. `dot` is the resting
// form; `alert` is what a state that needs the user takes, because the
// palette has no warning hue to promote a dot with.
const kdStatusMark = (mark) =>
  mark === "alert"
    ? kdIcon("status-block__icon", "i-attn")
    : kdBlock("span", "status-block__dot");

const renderStatusMark = (el, mark) => {
  const previous = el.querySelector("[data-status-mark]");
  if (previous) previous.remove();
  const node = kdStatusMark(mark);
  node.setAttribute("data-status-mark", "");
  node.setAttribute("aria-hidden", "true");
  el.insertBefore(node, el.firstChild);
};

// tone ∈ {ok, warn, muted, checking} — colours the mark and the verdict.
// mark ∈ {dot, alert}. `causeKey` is optional: a state with no explainable
// cause renders the verdict alone and hides the cause line rather than
// leaving a stale sentence behind.
//
// Deliberately sets no aria-label on the block: an aria-label would replace
// its content for assistive tech, announcing the verdict and swallowing the
// cause. The block is a polite live region, so both lines are read.
const renderStatusBlock = (
  $,
  msg,
  { tone = "muted", mark = "dot", verdictKey, verdictSubs, causeKey, causeSubs } = {}
) => {
  const el = $("status");
  el.className = `status-block status-block--${tone}`;
  renderStatusMark(el, mark);
  $("status-text").textContent = msg(verdictKey, verdictSubs);
  const cause = $("status-sub");
  if (!cause) return;
  cause.textContent = causeKey ? msg(causeKey, causeSubs) : "";
  cause.hidden = !causeKey;
};

// items: [{ label, modifier? }] — modifier is a `.chip--*` suffix
// ("out", "muted", "dashed", "more"). An empty list clears the region.
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

// The primitives a skeleton region is composed from. Each stands in for one
// resolved element at its real height, so a popup that names the right parts
// gets a checking layout the same height as the state that replaces it.
const KD_SKELETON_PARTS = {
  caption: () => kdBlock("div", "skeleton skeleton--caption"),
  chips: () => {
    const row = kdBlock("div", "chips");
    for (let i = 0; i < 3; i += 1) {
      row.appendChild(kdBlock("span", "skeleton skeleton--chip"));
    }
    return row;
  },
  line: () => kdBlock("div", "skeleton skeleton--line"),
  "line-short": () =>
    kdBlock("div", "skeleton skeleton--line skeleton--line-short"),
  cta: () => kdBlock("div", "skeleton skeleton--cta"),
  secondary: () => kdBlock("div", "skeleton skeleton--secondary"),
  block: () => kdBlock("div", "skeleton skeleton--block"),
  "block-sm": () => kdBlock("div", "skeleton skeleton--block-sm"),
};

// The two regions every popup has had since the shell landed. A popup that
// fills more than these passes its own list; the default keeps a
// two-region bridge working unchanged.
const KD_DEFAULT_SKELETON = [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
];

// regions: [{ region, parts: [partName] }] — the popup declares which regions
// it will fill and what each resolves to. Naming a region the popup never
// fills would leave a placeholder that outlives the probe, so a region absent
// from the document is skipped rather than created.
const renderSkeleton = ($, regions = KD_DEFAULT_SKELETON) => {
  for (const { region, parts } of regions) {
    const host = $(region);
    if (!host) continue;
    kdReplace(
      host,
      parts.filter((name) => KD_SKELETON_PARTS[name]).map((name) => KD_SKELETON_PARTS[name]())
    );
  }
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
