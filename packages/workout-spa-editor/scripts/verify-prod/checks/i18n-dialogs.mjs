import { isoDate, settledText } from "../browser.mjs";
import { englishLeaks, englishPieces, localeText } from "../locale.mjs";
import { findEnglish } from "./i18n-terms.mjs";

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
  const hits = [...findEnglish(copy), ...englishLeaks(copy, pieces)];
  rec.assert(
    hits.length === 0,
    `no English UI terms in ${label}`,
    hits.join(", ")
  );
}

const PERSONAL = { bodyWeight: "70", height: "175", birthDate: "1990-01-01" };

async function fillPersonal(dialog) {
  for (const [key, value] of Object.entries(PERSONAL)) {
    await dialog
      .getByLabel(es("athlete", `profileManager.personal.${key}`))
      .fill(value);
  }
  await dialog
    .getByLabel(es("athlete", "profileManager.personal.sex"))
    .selectOption("male");
}

// F-46b: every tab of the Profile Manager, the personal data filled in so
// the physiology selects show a chosen value, not only "not set".
export async function profileManager(rec, { page, go }) {
  await go("athlete");
  await page
    .getByRole("button", { name: es("athlete", "editProfile") })
    .click();
  const dialog = page.getByRole("dialog");
  // The zone editor nests its own sport tabs; the manager's come first.
  const tabs = dialog.getByRole("tablist").first().getByRole("tab");
  await tabs.first().waitFor();
  const pieces = englishPieces("athlete", "profileManager");
  const count = await tabs.count();
  rec.assert(
    count === 3,
    "F-46b: the Profile Manager shows its three tabs",
    `tabs=${count}`
  );
  for (let i = 0; i < count; i++) {
    await tabs.nth(i).click();
    const name = (await tabs.nth(i).innerText()).trim();
    if (i === 1) await fillPersonal(dialog);
    await scanDialog(rec, dialog, `the Profile Manager tab "${name}"`, pieces);
  }
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}

// F-39: the goal dialog with a goal steep enough to show the preview and the
// safety-cap warning. The preview needs the personal data saved above, so
// its appearance is also the signal that those writes landed.
export async function goalDialog(rec, { page }) {
  await page.evaluate(() => (window.location.hash = "#/nutrition"));
  await page.getByTestId("nutrition-set-goal").click();
  const dialog = page.getByTestId("goal-setup-dialog");
  const soon = new Date();
  soon.setDate(soon.getDate() + 14);
  await dialog.getByLabel(es("nutrition", "goalSetup.targetWeight")).fill("60");
  await dialog
    .getByLabel(es("nutrition", "goalSetup.targetDate"))
    .fill(isoDate(soon));
  await dialog.getByTestId("goal-cap-warning").waitFor();
  await scanDialog(
    rec,
    dialog,
    "the goal dialog",
    englishPieces("nutrition", "goalSetup")
  );
  await page.keyboard.press("Escape");
}
