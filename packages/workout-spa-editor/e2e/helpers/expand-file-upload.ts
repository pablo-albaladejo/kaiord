import type { Page } from "@playwright/test";

/**
 * Expands the "Or create manually / import a file" accordion
 * so the file input becomes visible in the DOM.
 */
export async function expandFileUpload(page: Page) {
  // Navigate to editor if not already there
  if (!page.url().includes("/workout")) {
    await page.goto("/workout/new");
  }

  const fileInput = page.locator('input[type="file"]');
  if ((await fileInput.count()) > 0) return;

  const accordion = page.getByRole("button", {
    name: /create manually.*import/i,
  });
  await accordion.waitFor({ state: "visible", timeout: 10000 });
  await accordion.click();

  // Retry click if React hadn't hydrated the onClick handler yet
  try {
    await fileInput.waitFor({ state: "attached", timeout: 3000 });
  } catch {
    await accordion.click();
    await fileInput.waitFor({ state: "attached", timeout: 5000 });
  }
}
