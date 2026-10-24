export type EstimatedZone = 1 | 2 | 3 | 4 | 5;

export type EstimatedSegment = {
  zone: EstimatedZone | null;
  seconds: number;
};

export type TimedStep = {
  kind: "timed";
  seconds: number;
  zone: EstimatedZone | null;
};

export type RepeatStep = {
  kind: "repeat";
  count: number;
  body: Array<Step>;
  between: Array<Step>;
};

export type Step = TimedStep | RepeatStep;

export type GroupParse = { steps: Array<Step>; rest: Array<Step> };

export type ParseGroup = (text: string) => GroupParse;
