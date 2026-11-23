/**
 * What a run sent, per destination, gathered as its requests are built: the
 * kinds counted in a request, and apart the kinds it may have carried but
 * cannot count. A kind counted once is no longer listed as declared.
 */
import type { TraceSent } from "../../types/trace-schemas";
import type { DataKind } from "../data-flows/data-kinds";
import type { DestinationId } from "../data-flows/destinations";

export type TraceSentLog = {
  add: (
    to: DestinationId,
    kinds: readonly DataKind[],
    declared?: readonly DataKind[]
  ) => void;
  list: () => TraceSent[];
};

const union = (a: readonly DataKind[], b: readonly DataKind[]): DataKind[] => [
  ...a,
  ...b.filter((kind) => !a.includes(kind)),
];

export const createTraceSentLog = (): TraceSentLog => {
  const sent = new Map<
    DestinationId,
    { kinds: DataKind[]; declared: DataKind[] }
  >();
  return {
    add: (to, kinds, declared = []) => {
      const known = sent.get(to) ?? { kinds: [], declared: [] };
      sent.set(to, {
        kinds: union(known.kinds, kinds),
        declared: union(known.declared, declared),
      });
    },
    list: () =>
      [...sent].map(([to, { kinds, declared }]) => {
        const uncounted = declared.filter((kind) => !kinds.includes(kind));
        return uncounted.length > 0
          ? { to, kinds: [...kinds], declared: uncounted }
          : { to, kinds: [...kinds] };
      }),
  };
};
