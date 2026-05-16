import {
  buildDummyWorkout,
  buildMatchedWorkout,
} from "./build-visual-workout-records";

export type MatchedCoachingSeed = {
  profileId: string;
  source: string;
  sourceId: string;
  workoutId: string;
  day: string;
  ts: string;
};

const DESCRIPTION =
  "5 min warm-up @ 55% FTP\n3 × 10 min @ 90% FTP / 5 min recovery\n5 min cool-down @ 50% FTP";

export const buildMatchedCoachingRecords = (seed: MatchedCoachingSeed) => {
  const compositeId = `${seed.profileId}:${seed.source}:${seed.sourceId}`;
  return {
    profile: {
      id: seed.profileId,
      name: "Visual test profile",
      sportZones: {},
      linkedAccounts: [{ source: "train2go", externalId: "t2g-visual-1" }],
      createdAt: seed.ts,
      updatedAt: seed.ts,
    },
    meta: { key: "activeProfileId", value: seed.profileId },
    dummy: buildDummyWorkout(seed.ts),
    activity: {
      id: compositeId,
      profileId: seed.profileId,
      source: seed.source,
      sourceId: seed.sourceId,
      date: seed.day,
      sport: "cycling",
      title: "Visual regression test activity",
      status: "pending",
      description: DESCRIPTION,
      duration: "60 min",
      fetchedAt: seed.ts,
    },
    workout: buildMatchedWorkout(seed, compositeId),
    match: {
      id: `${seed.profileId}:${compositeId}`,
      profileId: seed.profileId,
      coachingActivityId: compositeId,
      workoutId: seed.workoutId,
      matchedAt: seed.ts,
      source: "manual",
    },
  };
};
