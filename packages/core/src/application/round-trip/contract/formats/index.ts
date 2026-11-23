import type { RoundTripContract } from "../round-trip-contract";
import { FIT_ROUND_TRIP } from "./fit.contract";
import { GCN_ROUND_TRIP } from "./gcn.contract";
import { TCX_ROUND_TRIP } from "./tcx.contract";
import { ZWO_ROUND_TRIP } from "./zwo.contract";

/** What each format the Kaiord SDK reads and writes keeps of a workout. */
export const ROUND_TRIP_CONTRACTS: Readonly<
  Record<"fit" | "tcx" | "zwo" | "gcn", RoundTripContract>
> = {
  fit: FIT_ROUND_TRIP,
  tcx: TCX_ROUND_TRIP,
  zwo: ZWO_ROUND_TRIP,
  gcn: GCN_ROUND_TRIP,
};

export { FIT_ROUND_TRIP, GCN_ROUND_TRIP, TCX_ROUND_TRIP, ZWO_ROUND_TRIP };
