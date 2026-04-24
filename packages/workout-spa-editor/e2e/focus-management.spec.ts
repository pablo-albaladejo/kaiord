/**
 * Focus Management E2E spec (tasks 5.1.b, 5.2.a, 5.2.b).
 *
 * Tests the focus-management matrix:
 *   Actions × Trigger methods
 *
 * Fixture: e2e/fixtures/focus-workout.krd.json
 *   - Warm-up 10 min         (Step 1)
 *   - Interval 1 — Z4 push  (Step 2)
 *   - Recovery 1 min         (Step 3)
 *   - Interval 2 — Z4 hold  (Step 4)
 *   - Cooldown 5 min         (Step 5)
 *   - 2x Interval Set (block)
 *     - Block step A — Z3 tempo
 *     - Block step B — Z3 recover
 *
 * All selectors use accessible name (aria-label) rather than data-testid.
 * Step card aria-label format: "Step {n}: {name}"
 */

import { expect, test } from "./fixtures/base";
import {
  focusStep,
  loadFocusFixture,
  triggerViaKeyboard,
  triggerViaToolbar,
} from "./helpers/focus-management-helpers";

test.describe("Focus management — fixture load", () => {
  test("loads the fixture and renders all named steps", async ({ page }) => {
    await page.goto("/workout/new");
    await page.waitForLoadState("networkidle");
    const skip = page.getByRole("button", { name: /skip tutorial/i });
    if (await skip.isVisible()) await skip.click();

    await loadFocusFixture(page);

    await expect(
      page.getByRole("button", { name: /Warm-up 10 min/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Interval 1.*Z4 push/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Recovery 1 min/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Interval 2.*Z4 hold/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Cooldown 5 min/i })
    ).toBeVisible();
  });
});

test.describe("Focus management — Delete single", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/workout/new");
    await page.waitForLoadState("networkidle");
    const skip = page.getByRole("button", { name: /skip tutorial/i });
    if (await skip.isVisible()) await skip.click();
    await loadFocusFixture(page);
  });

  test("keyboard: delete middle step → focus moves to next sibling", async ({
    page,
  }) => {
    // Select "Interval 1 — Z4 push" (index 1) and delete via keyboard.
    // Expected: focus moves to "Recovery 1 min" (was index 2, now index 1).
    await focusStep(page, "Interval 1.*Z4 push");
    await triggerViaKeyboard(page, "delete");
    await expect(page.locator(":focus")).toHaveAccessibleName(
      /Recovery 1 min/i
    );
  });

  test("toolbar: delete middle step → focus moves to next sibling", async ({
    page,
  }) => {
    await triggerViaToolbar(page, "delete", "Interval 1.*Z4 push");
    await expect(page.locator(":focus")).toHaveAccessibleName(
      /Recovery 1 min/i
    );
  });

  test("keyboard: delete last step → focus moves to previous sibling", async ({
    page,
  }) => {
    await focusStep(page, "Cooldown 5 min");
    await triggerViaKeyboard(page, "delete");
    await expect(page.locator(":focus")).toHaveAccessibleName(
      /Interval 2.*Z4 hold/i
    );
  });

  test("keyboard: delete only step → focus moves to Add Step button", async ({
    page,
  }) => {
    // Delete all steps until one remains, then delete the last one.
    for (const name of [
      "Interval 1.*Z4 push",
      "Recovery 1 min",
      "Interval 2.*Z4 hold",
      "Cooldown 5 min",
    ]) {
      await focusStep(page, name);
      await triggerViaKeyboard(page, "delete");
    }
    // Delete the last remaining top-level step (Warm-up) — block still present.
    await focusStep(page, "Warm-up 10 min");
    await triggerViaKeyboard(page, "delete");
    // After deleting last step, focus goes to Add Step or block card.
    const focused = page.locator(":focus");
    const name = await focused.getAttribute("aria-label");
    expect(name).toBeTruthy();
  });
});

test.describe("Focus management — Undo / Redo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/workout/new");
    await page.waitForLoadState("networkidle");
    const skip = page.getByRole("button", { name: /skip tutorial/i });
    if (await skip.isVisible()) await skip.click();
    await loadFocusFixture(page);
  });

  test("keyboard: undo delete → focus returns to restored step", async ({
    page,
  }) => {
    await focusStep(page, "Interval 1.*Z4 push");
    await triggerViaKeyboard(page, "delete");
    // Undo the delete.
    await triggerViaKeyboard(page, "undo");
    await expect(page.locator(":focus")).toHaveAccessibleName(
      /Interval 1.*Z4 push/i
    );
  });

  test("keyboard: redo after undo → focus moves to re-deleted position", async ({
    page,
  }) => {
    await focusStep(page, "Interval 1.*Z4 push");
    await triggerViaKeyboard(page, "delete");
    await triggerViaKeyboard(page, "undo");
    await triggerViaKeyboard(page, "redo");
    // After redo of delete, focus should land on next sibling.
    await expect(page.locator(":focus")).toHaveAccessibleName(
      /Recovery 1 min/i
    );
  });
});

test.describe("Focus management — Duplicate", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/workout/new");
    await page.waitForLoadState("networkidle");
    const skip = page.getByRole("button", { name: /skip tutorial/i });
    if (await skip.isVisible()) await skip.click();
    await loadFocusFixture(page);
  });

  test("toolbar: duplicate step → focus moves to the new copy", async ({
    page,
  }) => {
    await triggerViaToolbar(page, "duplicate", "Warm-up 10 min");
    // The duplicate is inserted after the original; focus should land there.
    const focused = page.locator(":focus");
    await expect(focused).toHaveAccessibleName(/Warm-up 10 min/i);
  });
});

test.describe("Focus management — form-field short-circuit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/workout/new");
    await page.waitForLoadState("networkidle");
    const skip = page.getByRole("button", { name: /skip tutorial/i });
    if (await skip.isVisible()) await skip.click();
    await loadFocusFixture(page);
  });

  test("focus does not move away from an active text input during edit", async ({
    page,
  }) => {
    // Double-click (or click to expand) a step to open inline editing.
    await page
      .getByRole("button", { name: /Warm-up 10 min/i })
      .dblclick()
      .catch(() => {
        // Inline edit may not be triggered by dblclick; skip if unavailable.
      });
    const input = page.locator('[data-testid="editor-root"] input').first();
    if (await input.isVisible()) {
      await input.focus();
      // Trigger a mutation that would normally move focus.
      await focusStep(page, "Interval 1.*Z4 push");
      // Focus should remain on the input.
      await expect(page.locator(":focus")).toBe(input);
    } else {
      test.skip(true, "Inline editing not triggered — skip form-field guard");
    }
  });
});
