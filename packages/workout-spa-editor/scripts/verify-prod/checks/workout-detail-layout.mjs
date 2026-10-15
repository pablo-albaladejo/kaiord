// The workout detail on a desktop: the sheet is wider than a phone column,
// the actions are one line tall and on the first screen, and the header
// keeps the avatar on the nav row.

const MIN_SHEET_WIDTH = 640;
const MAX_ACTION_HEIGHT = 48;
const SAME_ROW_TOLERANCE = 4;

const fmt = (b) =>
  b
    ? `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`
    : "none";

const centerY = (b) => b.y + b.height / 2;

// A missing element reads as "none" in the evidence instead of timing out.
const boxOf = async (locator) =>
  (await locator.count()) > 0 ? locator.first().boundingBox() : null;

export async function detailLayout(rec, page) {
  await page.getByTestId("workout-detail-back").waitFor();
  const sheet = await boxOf(page.getByTestId("workout-detail"));
  rec.assert(
    sheet !== null && sheet.width >= MIN_SHEET_WIDTH,
    `the workout detail is at least ${MIN_SHEET_WIDTH} px wide on a desktop`,
    `sheet=${fmt(sheet)}`
  );
  // "On the first screen" holds only because `scheduleOn` builds a one-step
  // workout: a longer structure legitimately pushes the actions below the
  // fold, so grow that workout and this assertion has to change.
  const edit = await boxOf(page.getByRole("button", { name: /^Editar$/ }));
  const { height } = page.viewportSize();
  rec.assert(
    edit !== null &&
      edit.height <= MAX_ACTION_HEIGHT &&
      edit.y + edit.height <= height,
    "the detail's actions are one line tall and on the first screen",
    `edit=${fmt(edit)} viewportHeight=${height}`
  );
  const calendar = await boxOf(
    page.getByTestId("status-header-calendar-button")
  );
  const avatar = await boxOf(page.getByTestId("status-header-account-button"));
  rec.assert(
    calendar !== null &&
      avatar !== null &&
      Math.abs(centerY(avatar) - centerY(calendar)) <= SAME_ROW_TOLERANCE,
    "the header keeps the avatar on the nav row",
    `calendar=${fmt(calendar)} avatar=${fmt(avatar)}`
  );
}
