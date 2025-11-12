export enum DurationType {
  Time = "time",
  Distance = "distance",
  Open = "open",
}

export type Duration =
  | { type: DurationType.Time; seconds: number }
  | { type: DurationType.Distance; meters: number }
  | { type: DurationType.Open };
