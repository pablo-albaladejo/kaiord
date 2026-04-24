import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { expandFileUpload } from "./expand-file-upload";

const FIXTURE_PATH = fileURLToPath(
  new URL("../fixtures/focus-workout.krd.json", import.meta.url)
);

export async function loadFocusFixture(page: Page): Promise<void> {
  await expandFileUpload(page);
  const content = readFileSync(FIXTURE_PATH);
  await page.locator('input[type="file"]').setInputFiles({
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

const KEYBOARD_KEYS = {
  delete: "Delete",
  undo: "Meta+z",
  redo: "Meta+Shift+z",
  duplicate: "Meta+d",
} as const;

export async function triggerViaKeyboard(
  page: Page,
  action: keyof typeof KEYBOARD_KEYS
): Promise<void> {
  await page.keyboard.press(KEYBOARD_KEYS[action]);
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
  const label = action === "delete" ? /delete.*step/i : /duplicate.*step/i;
  await page.getByRole("button", { name: label }).first().click();
}
