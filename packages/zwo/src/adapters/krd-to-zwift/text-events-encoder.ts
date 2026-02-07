import type { WorkoutStep } from "@kaiord/core";

export const encodeTextEvents = (
  step: WorkoutStep
): Array<Record<string, unknown>> | Record<string, unknown> | undefined => {
  const stepExtensions = step.extensions?.zwift as
    | Record<string, unknown>
    | undefined;
  const textEvents = stepExtensions?.textEvents as
    | Array<Record<string, unknown>>
    | undefined;

  if (!textEvents || textEvents.length === 0) {
    return undefined;
  }

  if (textEvents.length === 1) {
    const event = textEvents[0];
    const encoded: Record<string, unknown> = {
      "@_message": event.message,
    };

    if (event.timeoffset !== undefined) {
      encoded["@_timeoffset"] = event.timeoffset;
    }
    if (event.distoffset !== undefined) {
      encoded["@_distoffset"] = event.distoffset;
    }

    return encoded;
  }

  return textEvents.map((event) => {
    const encoded: Record<string, unknown> = {
      "@_message": event.message,
    };

    if (event.timeoffset !== undefined) {
      encoded["@_timeoffset"] = event.timeoffset;
    }
    if (event.distoffset !== undefined) {
      encoded["@_distoffset"] = event.distoffset;
    }

    return encoded;
  });
};
