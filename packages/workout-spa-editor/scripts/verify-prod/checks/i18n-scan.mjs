import { isoDate, settledText } from "../browser.mjs";
import { ensureProfile } from "../steps.mjs";
import { openWellnessDialog } from "../wellness.mjs";
import { goalDialog, profileManager } from "./i18n-dialogs.mjs";
import { DESIGN_NOTES, findEnglish } from "./i18n-terms.mjs";

const ROUTES = [
  "calendar",
  "daily",
  "library",
  "nutrition",
  "athlete",
  "chat",
  "health",
  "health/sleep",
  "health/labs",
  "settings",
  "settings/general",
  "settings/data",
  "settings/privacy",
  "settings/about",
  "settings/connections",
  "workout/new",
  "workout/new?source=scratch",
];

function visibleCopy() {
  const attrs = [
    ...document.querySelectorAll("[aria-label],[title],[placeholder]"),
  ]
    .map((el) => [
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("placeholder"),
    ])
    .flat()
    .filter(Boolean);
  return `${document.body.innerText}\n${attrs.join("\n")}`;
}

async function scan(rec, page, label, designHits) {
  const copy = await settledText(page, visibleCopy);
  const hits = findEnglish(copy);
  rec.assert(
    hits.length === 0,
    `no English UI terms on ${label}`,
    hits.join(", ")
  );
  for (const note of DESIGN_NOTES)
    if (copy.includes(note)) designHits.add(`${note}… (${label})`);
}

async function wellnessDialog(rec, session, designHits) {
  await openWellnessDialog(session, isoDate(new Date()));
  await scan(rec, session.page, "the wellness dialog", designHits);
}

export default async function i18nScan({ rec, open }) {
  const session = await open();
  const { page, go } = session;
  await ensureProfile(session);
  const designHits = new Set();
  for (const route of ROUTES) {
    await go(route);
    await page.locator("main :is(h1,h2)").first().waitFor();
    await scan(rec, page, `#/${route}`, designHits);
  }
  await wellnessDialog(rec, session, designHits);
  await profileManager(rec, session);
  await goalDialog(rec, session);
  rec.assert(
    designHits.size === 0,
    "F-26: no internal design notes in the UI",
    [...designHits].join(" | ")
  );
}
