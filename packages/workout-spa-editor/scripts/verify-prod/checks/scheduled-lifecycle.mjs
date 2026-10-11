import { randomUUID } from "node:crypto";

import { expect } from "@playwright/test";

import { isoDate, mondayOf } from "../browser.mjs";
import { scheduleOn, totalSteps } from "../editor.mjs";
import { ensureProfile, expectOk } from "../steps.mjs";
import { moveByKeyboard } from "./scheduled-lifecycle-move.mjs";
import { deleteWithUndo, notFound } from "./scheduled-lifecycle-steps.mjs";

// F-28 card title, origin and duration, F-31 card → detail, F-29 edits
// persist, journey 15 keyboard move, F-30 delete + Undo, F-42 an unknown id
// says "not found".

async function editAndReload(rec, session, id) {
  const { page, go } = session;
  await go(`workout/${id}`);
  await page
    .getByText(/^Pasos totales:?$/)
    .first()
    .waitFor();
  const before = await totalSteps(page);
  await page.getByTestId("add-step-button").click();
  await expect.poll(() => totalSteps(page)).not.toBe(before);
  const after = await totalSteps(page);
  const save = page.getByRole("button", { name: /^Guardar cambios$/ });
  const labels = await page.locator("main button").allInnerTexts();
  rec.assert(
    (await save.count()) > 0,
    "F-29: the editor offers 'Guardar cambios'",
    `buttons=[${labels.filter(Boolean).join(" | ")}]`
  );
  if ((await save.count()) > 0) await save.click();
  await go(`workout/${id}`);
  await page
    .getByText(/^Pasos totales:?$/)
    .first()
    .waitFor();
  const reloaded = await totalSteps(page);
  rec.assert(
    reloaded === after,
    "F-29: an added step survives a reload",
    `before=${before} afterEdit=${after} afterReload=${reloaded}`
  );
}

// Another day of the same week, so the calendar's week view shows it.
function otherDayOfWeek(today) {
  const monday = mondayOf(today);
  const other = new Date(monday);
  if (isoDate(monday) === isoDate(today)) other.setDate(monday.getDate() + 1);
  return isoDate(other);
}

export default async function scheduledLifecycle({ rec, open }) {
  const session = await open();
  const { page } = session;
  await ensureProfile(session);
  const name = `VP lifecycle ${randomUUID().slice(0, 6)}`;
  const today = new Date();
  const { card, id } = await scheduleOn(session, isoDate(today), name);
  const cardText = await card.innerText();
  rec.assert(
    cardText.includes(name),
    "F-28: the calendar card shows the workout name",
    `card=${cardText} aria=${await card.getAttribute("aria-label")}`
  );
  rec.assert(
    !/scratch/.test(cardText) && /\b\d+m\b/.test(cardText),
    "F-28: the card names its origin in words and shows a duration",
    `card=${cardText}`
  );
  await card.click();
  await expectOk(
    rec,
    "F-31: clicking the card opens #/workout/view/<id>",
    () => expect(page).toHaveURL(/#\/workout\/view\//),
    async () => page.url()
  );
  await editAndReload(rec, session, id);
  await moveByKeyboard(rec, session, id, otherDayOfWeek(today));
  await deleteWithUndo(rec, session, id);
  await notFound(rec, session);
}
