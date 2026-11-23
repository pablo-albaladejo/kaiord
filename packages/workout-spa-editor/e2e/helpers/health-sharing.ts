import type { Page } from "@playwright/test";

type Answer = "always" | "never";
type Answers = Partial<Record<"anthropic" | "openai" | "google", Answer>>;

/** The key `lib/health-sharing-store.ts` keeps the standing answers under. */
export const HEALTH_SHARING_KEY = "kaiord-health-sharing";

/**
 * Gives the athlete's standing health-data answer per Provider before the
 * App loads, for a spec about something else: its messages then go without
 * the first-time notice.
 */
export async function answerHealthSharing(
  page: Page,
  answers: Answers
): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      // Runs in every frame; one without storage access has nothing to seed.
      try {
        if (window.localStorage.getItem(key) === null)
          window.localStorage.setItem(key, value);
      } catch {
        return;
      }
    },
    [HEALTH_SHARING_KEY, JSON.stringify(answers)] as const
  );
}
