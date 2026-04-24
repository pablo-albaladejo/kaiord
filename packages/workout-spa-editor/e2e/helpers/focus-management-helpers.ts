import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expandFileUpload } from "./expand-file-upload";

const FIXTURE_PATH = join(
  __dirname,
  "../fixtures/focus-workout.krd.json"
);

export async function loadFocusFixture(page: Page): Promise<void> {
  await expandFileUpload(page);
  const fileInput = page.locator('input[type="file"]');
  const content = readFileSync(FIXTURE_PATH);
  await fileInput.setInputFiles({
    name: "focus-workout.krd",
    mimeType: "application/json",
    buffer: content,
  });
  await page
    .getByText("Focus Management Test")
    .waitFor({ state: "visible", timeout: 10_000 });
  await page
    .locator('[data-testid="step-card"]')
    .first()
    .waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
}

export async function focusStep(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: new RegExp(name, "i") }).click();
}

export async function triggerViaKeyboard(
  page: Page,
  action: "delete" | "undo" | "redo" | "duplicate"
): Promise<void> {
  switch (action) {
    case "delete":
      await page.keyboard.press("Delete");
      break;
    case "undo":
      await page.keyboard.press("Meta+z");
      break;
    case "redo":
      await page.keyboard.press("Meta+Shift+z");
      break;
    case "duplicate":
      await page.keyboard.press("Meta+d");
      break;
  }
}

export async function triggerViaContextMenu(
  page: Page,
  action: "delete" | "duplicate" | "group" | "ungroup",
  targetName: string
): Promise<void> {
  await page
    .getByRole("button", { name: new RegExp(targetName, "i") })
    .click({ button: "right" });
  const menuItem = page.getByRole("menuitem", {
    name: new RegExp(action, "i"),
  });
  await menuItem.waitFor({ state: "visible", timeout: 3_000 });
  await menuItem.click();
}

export async function triggerViaToolbar(
  page: Page,
  action: "delete" | "duplicate",
  stepName: string
): Promise<void> {
  await focusStep(page, stepName);
  switch (action) {
    case "delete": {
      const btn = page
        .getByRole("button", { name: new RegExp(`delete.*step`, "i") })
        .first();
      await btn.click();
      break;
    }
    case "duplicate": {
      const btn = page
        .getByRole("button", { name: new RegExp(`duplicate.*step`, "i") })
        .first();
      await btn.click();
      break;
    }
  }
}
