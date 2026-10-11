import { expect } from "@playwright/test";

import { TIMEOUT } from "../browser.mjs";
import { expectOk } from "../steps.mjs";

const MAX_PRESSES = 12;

async function pressUntilFocused(page, key, target) {
  for (let press = 0; press < MAX_PRESSES; press++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
}

// Journey 15: the keyboard alternative to dragging a card to another day is
// "Más opciones" → "Mover a otro día" on the detail, with no pointer at all.
export async function moveByKeyboard(rec, session, id, date) {
  const { page, go } = session;
  await go(`workout/view/${id}`);
  const more = page.getByRole("button", { name: "Más opciones" });
  await more.waitFor();
  await more.focus();
  await page.keyboard.press("Enter");
  const item = page.getByRole("menuitem", { name: /^Mover a otro día$/ });
  const opened = await item
    .waitFor({ timeout: TIMEOUT })
    .then(() => true)
    .catch(() => false);
  rec.assert(opened, "Journey 15: the detail menu offers 'Mover a otro día'");
  if (!opened) return;
  await pressUntilFocused(page, "ArrowDown", item);
  await page.keyboard.press("Enter");
  await page.getByTestId("schedule-date-input").fill(date);
  const confirm = page.getByRole("button", { name: /^Mover$/ });
  await pressUntilFocused(page, "Tab", confirm);
  await page.keyboard.press("Enter");
  await go("calendar");
  await expectOk(
    rec,
    "Journey 15: a keyboard move puts the card on the new day",
    () =>
      expect(
        page.getByTestId(`day-column-${date}`).getByTestId(`workout-card-${id}`)
      ).toBeVisible({ timeout: TIMEOUT })
  );
}
