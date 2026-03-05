/**
 * Mock LLM response fixtures for E2E tests.
 * These mimic the Vercel AI SDK structured output format
 * as returned by the provider APIs.
 */

/** Anthropic-style response with a cycling workout. */
export const LLM_CYCLING_RESPONSE = {
  id: "msg_mock_001",
  type: "message",
  role: "assistant",
  content: [
    {
      type: "text",
      text: JSON.stringify({
        name: "Sweet Spot Cycling",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 150 } },
            intensity: "warmup",
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 1200 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 250 } },
            intensity: "active",
          },
          {
            stepIndex: 2,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 100 } },
            intensity: "cooldown",
          },
        ],
      }),
    },
  ],
  model: "claude-sonnet-4-5-20241022",
  stop_reason: "end_turn",
  usage: { input_tokens: 100, output_tokens: 200 },
};

/** Running workout response. */
export const LLM_RUNNING_RESPONSE = {
  ...LLM_CYCLING_RESPONSE,
  id: "msg_mock_002",
  content: [
    {
      type: "text",
      text: JSON.stringify({
        name: "Easy 5K Run",
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "pace",
            target: {
              type: "pace",
              value: { unit: "min_per_km", value: 6.0 },
            },
            intensity: "warmup",
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: 5000 },
            targetType: "pace",
            target: {
              type: "pace",
              value: { unit: "min_per_km", value: 5.0 },
            },
            intensity: "active",
          },
        ],
      }),
    },
  ],
};
