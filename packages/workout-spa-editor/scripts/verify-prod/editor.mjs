import { exact, mainText } from "./browser.mjs";

export async function openBlankEditor(session, { date, sport } = {}) {
  const { page, go } = session;
  const query = date ? `?date=${date}&from=calendar-day` : "";
  await go(`workout/new${query}`);
  if (sport) await page.getByRole("radio", { name: sport }).click();
  await page.getByRole("button", { name: exact("En blanco") }).click();
  await page.getByTestId("workout-name-input").waitFor();
}

export async function nameWorkout(page, name, sport = "running") {
  await page.getByTestId("workout-name-input").fill(name);
  await page.getByTestId("workout-sport-select").selectOption(sport);
  await page.getByTestId("save-metadata-button").click();
}

export async function addTimedStep(page, seconds) {
  const first = page.getByTestId("add-first-step-button");
  if (await first.isVisible()) await first.click();
  else await page.getByTestId("add-step-button").click();
  await page
    .getByText(/^(Step|Paso) \d+$/)
    .last()
    .click();
  await page
    .getByLabel(/Select duration type|Tipo de duración/)
    .selectOption("time");
  await page
    .getByLabel(/Duration \(seconds\)|Duración/)
    .first()
    .fill(String(seconds));
  await page
    .getByRole("button", { name: /Cerrar el formulario del paso|^Hecho$/ })
    .click();
}

export async function totalSteps(page) {
  const text = await mainText(page);
  return text.match(/Pasos totales:\s*([^\n]+)/)?.[1]?.trim() ?? "none";
}

// Schedules a one-step running workout on `date` and returns its calendar
// card. The card is looked up in the date's column, so a lost date fails here.
export async function scheduleOn(session, date, name) {
  const { page, go } = session;
  await openBlankEditor(session, { date, sport: /^(Running|Carrera)$/ });
  await nameWorkout(page, name);
  await addTimedStep(page, 600);
  await page.getByTestId("scratch-schedule-button").click();
  await go("calendar");
  const card = page
    .getByTestId(`day-column-${date}`)
    .locator('[data-testid^="workout-card-"]')
    .first();
  await card.waitFor();
  const testId = await card.getAttribute("data-testid");
  return { card, id: testId.replace("workout-card-", "") };
}
