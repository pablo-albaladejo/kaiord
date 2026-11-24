/**
 * How the Connector reads Train2Go's raw answers: the weekly and daily
 * endpoints answer JSON wrapping an HTML fragment, the profile page answers
 * HTML. A body that is not what Train2Go sends throws, which the request
 * layer reports as a malformed answer.
 */
import type { RawAnswer } from "../../bridge/thin-bridge-request";
import { extractComments } from "./extract-comments";
import { parseDailyHtml } from "./parse-daily-html";
import { parseDetailsHtml } from "./parse-details-html";
import { parseWeeklyHtml } from "./parse-weekly-html";
import type { Train2GoActivity, Train2GoComment } from "./train2go-wire-types";
import type { Train2GoZonesPayload } from "./train2go-zones-payload";

type Fragment = {
  data?: { replace?: Record<string, string>; content?: string };
};

const fragmentOf = (answer: RawAnswer): Fragment =>
  (JSON.parse(answer.body) as Fragment | null) ?? {};

export const readWeekAnswer = (
  answer: RawAnswer
): { activities: Train2GoActivity[] } => ({
  activities: parseWeeklyHtml(fragmentOf(answer).data?.replace?.["#workplan"]),
});

// The daily fragment is single-day and carries no date of its own, so each
// activity takes the date that was asked for; without it the activity drops
// out of every calendar day.
export const readDayAnswer =
  (date: string) =>
  (
    answer: RawAnswer
  ): { activities: Train2GoActivity[]; comments: Train2GoComment[] } => {
    const html = fragmentOf(answer).data?.content ?? "";
    return {
      activities: parseDailyHtml(html).map((a) => ({ ...a, date })),
      comments: extractComments(html),
    };
  };

export const readDetailsAnswer = (answer: RawAnswer): Train2GoZonesPayload =>
  parseDetailsHtml(
    /^\s*text\/html\b/i.test(answer.contentType) ? answer.body : ""
  );
