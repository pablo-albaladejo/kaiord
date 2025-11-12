export type KRD = {
  version: string;
  type: "workout" | "activity" | "course";
  metadata: KRDMetadata;
  sessions?: Array<KRDSession>;
  laps?: Array<KRDLap>;
  records?: Array<KRDRecord>;
  events?: Array<KRDEvent>;
  extensions?: {
    fit?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type KRDMetadata = {
  created: string;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
  sport: string;
  subSport?: string;
};

export type KRDSession = {
  startTime: string;
  totalElapsedTime: number;
  totalTimerTime?: number;
  totalDistance?: number;
  sport: string;
  subSport?: string;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  avgPower?: number;
  totalCalories?: number;
};

export type KRDLap = {
  startTime: string;
  totalElapsedTime: number;
  totalDistance?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgCadence?: number;
  avgPower?: number;
};

export type KRDRecord = {
  timestamp: string;
  position?: { lat: number; lon: number };
  altitude?: number;
  heartRate?: number;
  cadence?: number;
  power?: number;
  speed?: number;
  distance?: number;
};

export type KRDEvent = {
  timestamp: string;
  eventType: "start" | "stop" | "pause" | "resume" | "lap" | "marker" | "timer";
  eventGroup?: number;
  data?: number;
};
