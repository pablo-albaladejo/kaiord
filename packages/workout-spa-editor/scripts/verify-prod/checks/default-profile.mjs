import { expect } from "@playwright/test";

import { exact, isoDate, mainText, TIMEOUT } from "../browser.mjs";
import { addTimedStep, nameWorkout, openBlankEditor } from "../editor.mjs";
import { expectOk } from "../steps.mjs";
import { openWellnessDialog, SAVE } from "../wellness.mjs";

// F-09/F-23/F-06: a clean browser has no profile and every write is gated.
const PROFILE_GATE = /perfil de atleta|crea un perfil|create a profile/i;

async function scheduling(rec, session) {
  const { page } = session;
  await openBlankEditor(session);
  await nameWorkout(page, "verify default profile");
  await addTimedStep(page, 300);
  const button = page.getByTestId("scratch-schedule-button");
  await expectOk(
    rec,
    "F-09: 'Guardar y programar' is enabled without visiting #/athlete",
    () => expect(button).toBeEnabled({ timeout: TIMEOUT }),
    async () =>
      `disabled=${await button.isDisabled()} title=${await button.getAttribute("title")}`
  );
}

async function nutrition(rec, session) {
  const { page, go } = session;
  await go("nutrition");
  const add = page.getByRole("button", { name: exact("Añadir entrada") });
  const gate = page.getByText(PROFILE_GATE).first();
  await add.or(gate).first().waitFor();
  await expectOk(
    rec,
    "F-06: Nutrition offers 'Añadir entrada' instead of a profile gate",
    () => expect(add).toBeVisible({ timeout: 1 }),
    () => mainText(page)
  );
}

async function wellness(rec, session) {
  const { page } = session;
  const date = isoDate(new Date());
  const dialog = await openWellnessDialog(session, date);
  await dialog.getByLabel(/Weight \(kg\)|Peso \(kg\)/).fill("71.3");
  await dialog.getByRole("button", { name: SAVE }).click();
  const cell = page.getByTestId(`day-column-${date}`);
  await expectOk(
    rec,
    "wellness saved without a profile shows 71.3 in today's cell",
    () => expect(cell).toContainText("71.3", { timeout: TIMEOUT }),
    async () =>
      `dialogOpen=${await dialog.isVisible()} cell=${await cell.innerText()} body=${(await page.locator("body").innerText()).slice(-200)}`
  );
}

async function chat(rec, session) {
  const { page, go } = session;
  await go("chat");
  await page.locator("main :is(h1,h2,button)").first().waitFor();
  const text = await mainText(page);
  rec.assert(
    !PROFILE_GATE.test(text),
    "chat entry is not gated on a profile",
    text
  );
}

export default async function defaultProfile({ rec, open }) {
  const session = await open();
  await scheduling(rec, session);
  await nutrition(rec, session);
  await wellness(rec, session);
  await chat(rec, session);
}
