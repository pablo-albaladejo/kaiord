import type { Analytics } from "@kaiord/core";
import { vi } from "vitest";

import type { AiMeta } from "../../types/calendar-fragments";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import { buildCoachingTemplateKrd } from "./coaching-template";

export {
  buildStubCoachingRepo,
  buildStubWorkoutRepo,
  type StubWorkoutRepo,
} from "./convert-coaching-activity-with-ai.test-stubs";

export const stubActivity = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => {
  const p = overrides.profileId ?? "p1";
  const s = overrides.source ?? "train2go";
  const sid = overrides.sourceId ?? "12345";
  return {
    id: buildCoachingActivityId(p, s, sid),
    profileId: p,
    source: s,
    sourceId: sid,
    date: "2026-04-29",
    sport: "cycling",
    title: "FTP test",
    description: "Calentamiento Z1 + 5x(15s Z5)",
    status: "pending",
    fetchedAt: "2026-04-28T10:00:00.000Z",
    ...overrides,
  };
};

export const buildStubAnalytics = (): Analytics => ({
  pageView: vi.fn(),
  event: vi.fn(),
});
export const fakeKrd = (): KRD => buildCoachingTemplateKrd("cycling");
/** Simulates the LLM collapsing an unrecognised hint to `generic`. */
export const fakeGenericKrd = (): KRD => buildCoachingTemplateKrd("generic");
export const fakeAiMeta = (): AiMeta => ({
  promptVersion: "test",
  model: "test-model",
  provider: "test-provider",
  processedAt: "2026-05-04T10:00:00.000Z",
});
