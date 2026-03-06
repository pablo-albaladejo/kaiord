import type { Page } from "@playwright/test";

/**
 * Expands the "Or create manually / import a file" accordion
 * so the file input becomes visible in the DOM.
 */
export async function expandFileUpload(page: Page) {
  const accordion = page.getByText("Or create manually / import a file");
  if (await accordion.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accordion.click();
  }
}
