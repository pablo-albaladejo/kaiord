import { exact } from "../browser.mjs";
import { weekIdOf } from "../dates.mjs";
import { ensureProfile, expectOk, FIXTURES, waitForUrl } from "../steps.mjs";
import { libraryDialogs } from "./new-session-library.mjs";

// The sheet's other exits: Import file dropped the day, Template had no
// picking mode (journey 6). The library dialogs live in new-session-library.

export async function openDaySheet(session, day) {
  const { page, go } = session;
  await go("calendar");
  await page
    .getByTestId(`empty-day-${day}`)
    .or(page.getByTestId(`calendar-list-add-${day}`))
    .first()
    .click();
  await page.getByTestId("add-entry-choose-workout").click();
}

async function importOnDay(rec, session, day) {
  const { page } = session;
  const week = weekIdOf(day);
  await openDaySheet(session, day);
  await page.getByRole("button", { name: exact("Importar archivo") }).click();
  await page
    .getByTestId("file-upload-input")
    .setInputFiles(`${FIXTURES}fit/Activity.fit`);
  await expectOk(
    rec,
    `import from the day sheet lands the activity on ${day}'s week`,
    () => waitForUrl(page, new RegExp(`#/calendar/${week}$`)),
    async () => `url=${page.url().split("#")[1]}`
  );
}

async function templateForDay(rec, session, day) {
  const { page } = session;
  await openDaySheet(session, day);
  await page.getByRole("button", { name: exact("Plantilla") }).click();
  await expectOk(
    rec,
    "journey 6: 'Plantilla' opens the library picking for the day",
    () => page.getByTestId("library-picker-hint").waitFor(),
    async () => `url=${page.url().split("#")[1]}`
  );
  const url = page.url();
  rec.assert(
    url.includes("source=template-picker") && url.includes(`date=${day}`),
    "journey 6: the picker keeps the day in the URL",
    url
  );
}

async function fresh(open) {
  const session = await open();
  await ensureProfile(session);
  return session;
}

export async function otherExits(rec, open, day) {
  await importOnDay(rec, await fresh(open), day);
  await templateForDay(rec, await fresh(open), day);
  await libraryDialogs(rec, await fresh(open));
}
