import { diffRoundTrip } from "../application/round-trip/contract/diff-round-trip";
import type { RoundTripContract } from "../application/round-trip/contract/round-trip-contract";
import type { KRD } from "../domain/schemas/krd";
import { buildRoundTripCases, buildUnsupportedCases } from "./round-trip-cases";

/** A format's reader and writer, as the adapter exports them. */
export type RoundTripCodec<T> = {
  read: (data: T) => Promise<KRD>;
  write: (krd: KRD) => Promise<T>;
};

export type RoundTripFixture<T> = { name: string; data: T };

export type RoundTripReport = {
  /** One line per value lost, added or moved outside its tolerance. */
  differences: Array<string>;
  /** The declared fields that excused at least one value. */
  declared: Set<string>;
};

const describeFailure = (where: string, error: unknown): string =>
  `${where}: threw ${error instanceof Error ? error.message : String(error)}`;

const describeDifferences = (
  where: string,
  result: ReturnType<typeof diffRoundTrip>
): Array<string> =>
  result.differences.map((d) => {
    const values = `${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`;
    return `${where}: ${d.kind} ${d.field} (${values})`;
  });

type Trip = { lines: Array<string>; declared: Array<string>; after?: KRD };

const tripper =
  <T>(contract: RoundTripContract, codec: RoundTripCodec<T>) =>
  async (where: string, before: KRD): Promise<Trip> => {
    try {
      const after = await codec.read(await codec.write(before));
      const result = diffRoundTrip(before, after, contract);
      const lines = describeDifferences(where, result);
      return { lines, declared: result.declared, after };
    } catch (error) {
      return { lines: [describeFailure(where, error)], declared: [] };
    }
  };

const merge = (trips: ReadonlyArray<Trip>): RoundTripReport => ({
  differences: trips.flatMap((t) => t.lines),
  declared: new Set(trips.flatMap((t) => t.declared)),
});

/**
 * Sends every case of the contract through the format twice (KRD → format →
 * KRD → format → KRD) and every fixture once (format → KRD → format → KRD),
 * comparing each KRD with the one before it under the contract. Cases run
 * concurrently; the report keeps their order.
 */
export const roundTripReport = async <T>(
  contract: RoundTripContract,
  codec: RoundTripCodec<T>,
  fixtures: ReadonlyArray<RoundTripFixture<T>> = []
): Promise<RoundTripReport> => {
  const trip = tripper(contract, codec);
  const back = `(${contract.name} → KRD → ${contract.name})`;
  const cases = buildRoundTripCases(contract).map(async ({ name, krd }) => {
    const once = await trip(`${name} (KRD → ${contract.name} → KRD)`, krd);
    return once.after
      ? [once, await trip(`${name} ${back}`, once.after)]
      : [once];
  });
  const files = fixtures.map(async ({ name, data }): Promise<Array<Trip>> => {
    try {
      return [await trip(`${name} ${back}`, await codec.read(data))];
    } catch (error) {
      return [{ lines: [describeFailure(name, error)], declared: [] }];
    }
  });
  return merge((await Promise.all([...cases, ...files])).flat());
};

/** The unsupported cases that came back intact: a declaration no longer true. */
export const unsupportedButCarried = async <T>(
  contract: RoundTripContract,
  codec: RoundTripCodec<T>
): Promise<Array<string>> => {
  const kept = await Promise.all(
    buildUnsupportedCases(contract).map(async ({ name, krd }) => {
      try {
        const after = await codec.read(await codec.write(krd));
        const { differences } = diffRoundTrip(krd, after, contract);
        return differences.length === 0 ? [name] : [];
      } catch {
        return []; // The writer refuses it: not carried, as declared.
      }
    })
  );
  return kept.flat();
};

/** Declared fields no value needed: stale declarations to delete. */
export const unusedDeclarations = (
  contract: RoundTripContract,
  report: RoundTripReport
): Array<string> =>
  [...contract.notCarried, ...contract.filledIn]
    .map((d) => d.field)
    .filter((field) => !report.declared.has(field));
