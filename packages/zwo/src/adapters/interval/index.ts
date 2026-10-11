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

  const primaryMessage = events[0]!.message;
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

const toEvents = (
  textevent?: ZwiftTextEvent | Array<ZwiftTextEvent>
): Array<ZwiftTextEvent> =>
  !textevent ? [] : Array.isArray(textevent) ? textevent : [textevent];

// The writer lists on-step events first and records how many in
// kaiord:textEventSplit, offsetting the off-step ones from the start of the
// pair (seconds by OnDuration, meters by the on-step distance).
// Without the split (native ZWO) every event stays on the on-step.
export const splitIntervalsTTextEvents = (
  textevent: ZwiftTextEvent | Array<ZwiftTextEvent> | undefined,
  split: number | undefined,
  onShift: { seconds?: number; meters?: number } = {}
): { on: Array<ZwiftTextEvent>; off: Array<ZwiftTextEvent> } => {
  const events = toEvents(textevent);
  if (split === undefined) return { on: events, off: [] };
  const off = events.slice(split).map((event) => {
    const restored: ZwiftTextEvent = { message: event.message };
    if (event.timeoffset !== undefined) {
      restored.timeoffset = event.timeoffset - (onShift.seconds ?? 0);
    }
    if (event.distoffset !== undefined) {
      restored.distoffset = event.distoffset - (onShift.meters ?? 0);
    }
    return restored;
  });
  return { on: events.slice(0, split), off };
};
