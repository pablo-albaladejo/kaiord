import type { Page } from "@playwright/test";

/**
 * Expands the "Or create manually / import a file" accordion
 * so the file input becomes visible in the DOM.
 */
export async function expandFileUpload(page: Page) {
  // The file input might already be in the DOM if accordion was expanded
  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count() > 0) return;

  // Click the accordion to reveal file upload
  const accordion = page.getByText(/create manually.*import/i);
  await accordion.click();
  await fileInput.waitFor({ state: "attached", timeout: 5000 });
}
