import { expect } from "@playwright/test";

import { mainText, TIMEOUT } from "../browser.mjs";
import { expectOk } from "../steps.mjs";

// P-02/P-19: /athlete shows the editable Body section (personal data and
// max heart rate), and the deep link from Daily lands on it. Read-only: a
// clean browser already has its default profile, so nothing is written.
export default async function athleteBody({ rec, open }) {
  const { page, go } = await open();
  await go("athlete?section=body");
  const body = page.locator("#body");
  await expectOk(
    rec,
    "P-02: /athlete shows the 'Cuerpo' section with its editable fields",
    async () => {
      await expect(body).toBeVisible({ timeout: TIMEOUT });
      await expect(body.getByLabel(/^Altura/)).toBeVisible();
      await expect(body.getByLabel(/^Peso corporal/)).toBeVisible();
    },
    () => mainText(page)
  );
  await expectOk(
    rec,
    "P-19: the Body section has a max heart rate field",
    () =>
      expect(body.getByLabel(/^Frecuencia cardiaca máxima/)).toBeVisible({
        timeout: TIMEOUT,
      }),
    () => mainText(page)
  );
  await expectOk(
    rec,
    "the '?section=body' deep link focuses the Body section",
    () => expect(body).toBeFocused({ timeout: TIMEOUT }),
    () => page.evaluate(() => document.activeElement?.outerHTML.slice(0, 120))
  );
}
