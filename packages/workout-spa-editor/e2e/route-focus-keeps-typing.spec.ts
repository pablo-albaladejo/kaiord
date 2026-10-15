/**
 * After a route change the app moves focus to the page heading, and retries
 * while the engine drops that focus — Mobile Safari does, for a while after a
 * navigation. A retry that finally lands must not take focus back from a
 * field the user has already moved into: it did, and the keystrokes typed
 * next went to the heading. That is how `ai-generate-workout` 8.10 saw its
 * API key field stay empty and "Save account" stay disabled on Mobile Safari.
 *
 * The drop is simulated so every engine runs the window Mobile Safari only
 * opens intermittently: heading focus is ignored from boot until the field
 * is focused, so no heading holds focus when the route changes.
 *
 * It depends on the hook's 5 s retry budget: the field must be focused
 * before the budget expires. On a runner slow enough to miss it, the retry
 * is already gone and the spec passes whatever the hook does — a false green,
 * never a false red.
 */

import { expect, test } from "./fixtures/base";
import { clickCentred } from "./helpers/click-centred";
import { routeInApp } from "./helpers/route-in-app";

type DropFlag = { __dropHeadingFocus?: boolean };

test("should keep every keystroke typed right after a route change", async ({
  page,
}) => {
  // Arrange
  await page.addInitScript(() => {
    const realFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (
      this: HTMLElement,
      options?: FocusOptions
    ) {
      const dropping = (window as DropFlag).__dropHeadingFocus === true;
      if (dropping && this.hasAttribute("data-route-heading")) return;
      realFocus.call(this, options);
    };
    (window as DropFlag).__dropHeadingFocus = true;
  });
  await page.goto("/calendar");
  await expect(page.getByTestId("calendar-page")).toBeVisible();
  const settingsPage = page.getByTestId("settings-page");
  const addAccount = settingsPage.getByRole("button", { name: "Add account" });
  await routeInApp(page, "/settings/ai", addAccount);
  await clickCentred(addAccount);
  const keyField = settingsPage.getByPlaceholder("sk-...");
  await clickCentred(keyField);
  await page.evaluate(() => {
    (window as DropFlag).__dropHeadingFocus = false;
  });

  // Act
  await keyField.pressSequentially("sk-test-key-for-e2e", { delay: 40 });

  // Assert
  await expect(keyField).toHaveValue("sk-test-key-for-e2e");
  await expect(
    settingsPage.getByRole("button", { name: "Save account" })
  ).toBeEnabled();
});
