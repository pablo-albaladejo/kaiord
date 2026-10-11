/**
 * Leaving the app while a lazy route is still loading must actually leave.
 *
 * Firefox cancels a document's in-flight requests as soon as a navigation
 * away starts, while the old document keeps running until the destination
 * commits. The pending `import()` of the lazy page rejects with "error
 * loading dynamically imported module" — the message a stale post-deploy
 * chunk produces — and the stale-chunk recovery answered it with
 * `location.reload()`, which replaced the navigation the user had asked
 * for. In e2e that surfaced as `NS_BINDING_ABORTED` on whatever `goto` or
 * `reload` was in flight, across unrelated specs.
 *
 * The second case adds an unsaved-changes prompt the user confirms: a
 * prompted leave is still a leave once confirmed, so it must not be
 * mistaken for one the user cancelled.
 *
 * The destination answers slowly so the old document is still alive when
 * the rejection arrives; a fast `about:blank` commits first and hides the
 * race most of the time, which is why the original failures were
 * intermittent.
 */

import { expect, test } from "./fixtures/base";

const DESTINATION = "http://localhost:5173/__leave-destination.html";
const DESTINATION_DELAY_MS = 1500;

test.describe("leaving during a lazy route load", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(DESTINATION, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, DESTINATION_DELAY_MS));
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>elsewhere</title>",
      });
    });
  });

  test("should land on the destination instead of reloading the app", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/workout/new?source=scratch");

    // Act
    await page.goto(DESTINATION);

    // Assert
    await expect(page).toHaveURL(DESTINATION);
  });

  test("should land on the destination after the user confirms the leave prompt", async ({
    page,
  }) => {
    // Arrange: an unsaved-changes guard holds every leave behind a prompt,
    // and the user answers "leave".
    await page.addInitScript(() => {
      window.addEventListener("beforeunload", (event) =>
        event.preventDefault()
      );
    });
    page.on("dialog", (dialog) => void dialog.accept());
    await page.goto("/workout/new?source=scratch");

    // Act
    await page.goto(DESTINATION);

    // Assert
    await expect(page).toHaveURL(DESTINATION);
  });
});
