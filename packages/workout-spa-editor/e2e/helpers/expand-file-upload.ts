import type { Page } from "@playwright/test";

/**
 * Expands the "Or create manually / import a file" accordion
 * so the file input becomes visible in the DOM.
 * Waits for the file input to actually appear after clicking.
 */
export async function expandFileUpload(page: Page) {
  const accordion = page.getByText("Or create manually / import a file");
  await accordion.waitFor({ state: "visible", timeout: 5000 });
  await accordion.click();
  await page
    .locator('input[type="file"]')
    .waitFor({ state: "attached", timeout: 5000 });
}
