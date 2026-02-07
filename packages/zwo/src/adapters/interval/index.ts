export type ZwiftTextEvent = {
  message?: string;
  timeoffset?: number;
  distoffset?: number;
};

export const extractTextEvents = (
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>
): {
  notes?: string;
  extensions?: { zwift: { textEvents: Array<ZwiftTextEvent> } };
} => {
  if (!textevent) {
    return {};
  }

  const events = Array.isArray(textevent) ? textevent : [textevent];

  if (events.length === 0) {
    return {};
  }

  const primaryMessage = events[0].message;
  const result: {
    notes?: string;
    extensions?: { zwift: { textEvents: Array<ZwiftTextEvent> } };
  } = {};

  if (primaryMessage) {
    result.notes = primaryMessage;
  }

  if (events.length > 0) {
    result.extensions = {
      zwift: {
        textEvents: events,
      },
    };
  }

  return result;
};

export { mapFreeRideToKrd } from "./free-ride.mapper";
export { mapIntervalsTToKrd } from "./intervals-t.mapper";
export { mapCooldownToKrd, mapRampToKrd, mapWarmupToKrd } from "./ramp.mapper";
export { mapSteadyStateToKrd } from "./steady-state.mapper";
