import { englishPieces } from "../locale.mjs";
import { scanDialog } from "./i18n-dialogs.mjs";

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
