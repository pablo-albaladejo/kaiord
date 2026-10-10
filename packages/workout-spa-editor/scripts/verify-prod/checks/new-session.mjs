import { expect } from "@playwright/test";

import { exact, isoDate, mondayOf, TIMEOUT } from "../browser.mjs";
import { addTimedStep } from "../editor.mjs";
import { ensureProfile, expectOk } from "../steps.mjs";

// F-27/F-08 the chosen day is lost, F-07 the chosen sport is lost,
// F-43 "Cerrar" on a dated sheet does not close it.
const RUNNING = /^(Running|Carrera)$/;

async function startFromMonday(session, monday) {
  const { page, go } = session;
  await go("calendar");
  await page
    .getByTestId(`empty-day-${monday}`)
    .or(page.getByTestId(`calendar-list-add-${monday}`))
    .first()
    .click();
  await page.getByTestId("add-entry-choose-workout").click();
  await page.getByRole("radio", { name: RUNNING }).click();
  await page.getByRole("button", { name: exact("En blanco") }).click();
  await page.getByTestId("workout-name-input").waitFor();
}

async function scheduleAndFind(page, go) {
  await page.getByTestId("workout-name-input").fill("VP monday");
  await page.getByTestId("save-metadata-button").click();
  await addTimedStep(page, 600);
  await page.getByTestId("scratch-schedule-button").click();
  await go("calendar");
  const card = page.locator('[data-testid^="workout-card-"]').first();
  await card.waitFor();
  return card.evaluate(
    (el) => el.closest('[data-testid^="day-column-"]')?.dataset.testid
  );
}

async function closeDatedSheet(rec, session, monday) {
  const { page, go } = session;
  await go(`workout/new?date=${monday}&from=calendar-day`);
  const sheet = page.getByRole("heading", { level: 2, name: "Nueva sesión" });
  await sheet.waitFor();
  await page.getByRole("button", { name: "Cerrar" }).first().click();
  await expectOk(
    rec,
    "F-43: 'Cerrar' closes the dated 'Nueva sesión' sheet",
    () => expect(sheet).toBeHidden({ timeout: TIMEOUT }),
    async () => `url=${page.url()} sheetVisible=${await sheet.isVisible()}`
  );
}

export default async function newSession({ rec, open }) {
  const session = await open();
  const { page, go } = session;
  await ensureProfile(session);
  const today = new Date();
  const day = mondayOf(today);
  if (day.getDate() === today.getDate()) day.setDate(day.getDate() + 1);
  const monday = isoDate(day);
  await startFromMonday(session, monday);
  const url = page.url();
  rec.assert(
    url.includes(`date=${monday}`),
    "F-08: 'En blanco' keeps the chosen date in the URL",
    url
  );
  const sport = await page.getByTestId("workout-sport-select").inputValue();
  rec.assert(
    sport === "running",
    "F-07: the editor keeps the chosen sport (Running)",
    `sport=${sport}`
  );
  await page.getByTestId("workout-sport-select").selectOption("running");
  const column = await scheduleAndFind(page, go);
  rec.assert(
    column === `day-column-${monday}`,
    `F-27: the scheduled card lands on the chosen day ${monday}`,
    `landed in ${column}`
  );
  await closeDatedSheet(rec, session, monday);
}
