export const buildStructuredCyclingKrd = (ts: string) => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: ts, sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Visual regression test activity",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 140 } },
          intensity: "warmup",
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 240 } },
          intensity: "active",
        },
        {
          stepIndex: 2,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 140 } },
          intensity: "cooldown",
        },
      ],
    },
  },
});
