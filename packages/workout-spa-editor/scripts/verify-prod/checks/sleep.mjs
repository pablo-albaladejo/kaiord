import { isoDate, mainText } from "../browser.mjs";
import { ensureProfile } from "../steps.mjs";
import { openWellnessDialog, SAVE } from "../wellness.mjs";

// F-34: a manual sleep score is stored as a 0 h sleep session.
// F-37: health pages have no "add a data point" CTA.
const HOURS_FIELD = /Horas de sueño|Sleep (hours|duration)/i;
const SCORE_FIELD = /Sleep score|Puntuación de sueño/i;
const ADD_CTA = /Añadir (dato|registro|un dato)|Registrar|Add (data|entry)/i;
const HEALTH_PAGES = ["sleep", "weight", "recovery", "activity"];

async function logSleep(session, date) {
  const dialog = await openWellnessDialog(session, date);
  const hours = dialog.getByLabel(HOURS_FIELD);
  const hasHours = (await hours.count()) > 0;
  if (hasHours) await hours.fill("7:30");
  else await dialog.getByLabel(SCORE_FIELD).fill("81");
  await dialog.getByRole("button", { name: SAVE }).click();
  await dialog.waitFor({ state: "hidden" });
  return hasHours;
}

export default async function sleep({ rec, open }) {
  const session = await open();
  const { page, go } = session;
  await ensureProfile(session);
  const date = isoDate(new Date());
  const hasHours = await logSleep(session, date);
  rec.assert(
    hasHours,
    "F-34: the wellness form asks for sleep hours",
    "only 'Sleep score' exists; filled 81"
  );
  await go("health/sleep");
  const row = page.locator("main").getByText(date).first();
  await row.waitFor();
  const text = await mainText(page);
  rec.assert(
    !/\b0 h 0 min\b|\b0\.0 ?h\b/.test(text),
    "F-34: a manual entry is not a 0 h sleep session",
    text
  );
  if (hasHours) {
    rec.assert(
      /7 h 30 min|7\.5 ?h/.test(text),
      "F-34: 7:30 shows as 7 h 30 min",
      text
    );
  }
  for (const route of HEALTH_PAGES) {
    await go(`health/${route}`);
    await page.locator("main h1").first().waitFor();
    const cta = page.locator("main :is(button,a)").filter({ hasText: ADD_CTA });
    const labels = await page.locator("main :is(button,a)").allInnerTexts();
    rec.assert(
      (await cta.count()) > 0,
      `F-37: /health/${route} has an add-data CTA`,
      `controls=[${labels.join(" | ")}]`
    );
  }
}
