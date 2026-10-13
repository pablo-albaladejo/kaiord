import { isoDate, settledText } from "../browser.mjs";
import { englishLeaks, englishPieces } from "../locale.mjs";
import { findEnglish } from "./i18n-terms.mjs";
import { recordWeight } from "./record-weight.mjs";

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

export async function scanDialog(rec, dialog, label, pieces) {
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
