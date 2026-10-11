import { isoDate, mainText, oneLine } from "../browser.mjs";
import { ensureProfile, FIXTURES, waitForUrl } from "../steps.mjs";

// F-21: every FIT import fails in the production bundle.
const CASES = [
  { file: "fit/WorkoutRepeatSteps.fit", kind: "workout" },
  { file: "fit/Activity.fit", kind: "activity", lands: /#\/calendar\// },
  {
    file: "fit/HealthHrvOvernight.fit",
    kind: "hrv",
    lands: /#\/health\/recovery/,
  },
  {
    file: "fit/WeightScaleMultiUser.fit",
    kind: "scale",
    lands: /#\/health\/weight/,
  },
];

async function importOne(open, { file, kind }) {
  const session = await open();
  await ensureProfile(session);
  const date = isoDate(new Date());
  const query = kind === "workout" ? "" : `&date=${date}&from=calendar-day`;
  await session.go(`workout/new?action=import${query}`);
  await session.page
    .getByTestId("file-upload-input")
    .setInputFiles(`${FIXTURES}${file}`);
  return session;
}

async function observe(page) {
  const text = await mainText(page);
  const failure = text.match(/Import Failed[\s\S]{0,200}/)?.[0];
  return `url=${page.url().split("#")[1]} ${oneLine(failure ?? text, 200)}`;
}

async function settle(page, lands) {
  const failed = page.getByText(/^Import Failed$/);
  if (!lands) {
    const steps = page.getByText(/^Pasos totales:?$/).first();
    await steps.or(failed).first().waitFor();
    return steps.isVisible();
  }
  await Promise.race([waitForUrl(page, lands), failed.waitFor()]).catch(
    () => {}
  );
  return lands.test(page.url());
}

export default async function fitImport({ rec, open }) {
  for (const c of CASES) {
    const { page } = await importOne(open, c);
    const ok = await settle(page, c.lands);
    rec.assert(
      ok,
      `${c.kind} FIT (${c.file}) imports`,
      ok ? undefined : await observe(page)
    );
  }
}
