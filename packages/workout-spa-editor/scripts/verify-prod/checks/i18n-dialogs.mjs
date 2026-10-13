import { isoDate, settledText } from "../browser.mjs";
import { englishLeaks, englishPieces, localeText } from "../locale.mjs";
import { findEnglish } from "./i18n-terms.mjs";
import { recordWeight } from "./record-weight.mjs";

const es = (ns, key) => localeText("es", ns, key);

// innerText skips a closed <select>'s options and every attribute, so both
// are read on their own.
function dialogCopy(root) {
  const attrs = [...root.querySelectorAll("[aria-label],[title],[placeholder]")]
    .flatMap((el) =>
      ["aria-label", "title", "placeholder"].map((a) => el.getAttribute(a))
    )
    .filter(Boolean);
  const options = [...root.querySelectorAll("option")].map(
    (o) => o.textContent
  );
  return [root.innerText, ...attrs, ...options].join("\n");
}

async function scanDialog(rec, dialog, label, pieces) {
  const copy = await settledText(dialog.page(), dialogCopy, dialog);
  const hits = [
    ...new Set([...findEnglish(copy), ...englishLeaks(copy, pieces)]),
  ];
  rec.assert(
    hits.length === 0,
    `no English UI terms in ${label}`,
    hits.join(", ")
  );
}

// Fields by type and order, not by label: a label that regressed to English
// must reach the scan and be reported, not stop the check before it. The
// Body section's numbers are the current weight (recorded on its own, see
// record-weight.mjs), then height, then resting HR. Numbers commit on Enter.
async function fillPersonal(body) {
  const numbers = body.locator('input[type="number"]');
  for (const [index, value] of [
    [1, "175"],
    [2, "55"],
  ]) {
    await numbers.nth(index).fill(value);
    await numbers.nth(index).press("Enter");
  }
  await body.locator('input[type="date"]').fill("1990-01-01");
  await body.locator("select").first().selectOption("male");
}

// F-46b: the personal data the Profile Manager's tab held now lives in the
// Body section of #/athlete (P-15), filled in so the physiology selects show
// a chosen value, not only "not set". No dialog opens on the way.
export async function bodySection(rec, { page, go }) {
  await go("athlete?section=body");
  const body = page.locator("#body");
  await body.locator("select").first().waitFor();
  const fields = {
    numbers: await body.locator('input[type="number"]').count(),
    dates: await body.locator('input[type="date"]').count(),
    selects: await body.locator("select").count(),
  };
  rec.assert(
    fields.numbers === 3 && fields.dates === 1 && fields.selects === 2,
    "F-46b: #/athlete's Body section holds weight, height, resting HR, birth date, sex and activity level",
    JSON.stringify(fields)
  );
  await fillPersonal(body);
  await scanDialog(
    rec,
    body,
    "the Body section with its data filled in",
    englishPieces("athlete", "body")
  );
  rec.assert(
    (await page.getByRole("dialog").count()) === 0,
    "P-15: editing the personal data opens no dialog"
  );
}

// P-15: the athletes list is a page now; its own copy is checked against
// the English locale, beyond the generic route scan.
export async function athletesPage(rec, { page, go }) {
  await go("athletes");
  const main = page.getByTestId("athletes-page");
  await main.locator("li").first().waitFor();
  await scanDialog(
    rec,
    main,
    "#/athletes",
    englishPieces("athlete", "athletes")
  );
}

// F-39: the goal dialog with a goal steep enough to show the preview and the
// safety-cap warning. The preview needs the personal data saved above and a
// current weight, so its appearance is also the signal that those writes
// landed.
export async function goalDialog(rec, { page }) {
  await recordWeight(page);
  await page.evaluate(() => (window.location.hash = "#/nutrition"));
  await page.getByTestId("nutrition-set-goal").click();
  const dialog = page.getByTestId("goal-setup-dialog");
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  // Start weight, then target weight; the date is the only date input.
  await dialog.locator('input[type="number"]').nth(1).fill("60");
  await dialog.locator('input[type="date"]').fill(isoDate(soon));
  await dialog.getByTestId("goal-cap-warning").waitFor();
  await scanDialog(
    rec,
    dialog,
    "the goal dialog",
    englishPieces("nutrition", "goalSetup")
  );
  await page.keyboard.press("Escape");
}
