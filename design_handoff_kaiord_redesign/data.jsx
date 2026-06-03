// data.jsx — mock domain data for the Kaiord redesign prototype.

const ATHLETE = {
  name: "Pablo Albaladejo",
  handle: "@pablo",
  tagline: "Cyclist · Runner",
  since: "2023",
  initials: "PA",
};

// Per-sport thresholds + derived zones (5-zone model).
const SPORTS = {
  cycling: {
    label: "Cycling",
    icon: "bike",
    metrics: [
      {
        key: "ftp",
        label: "FTP",
        value: "265",
        unit: "W",
        hint: "Functional Threshold Power",
      },
      {
        key: "lthr",
        label: "Threshold HR",
        value: "168",
        unit: "bpm",
        hint: "Lactate threshold HR",
      },
      {
        key: "max",
        label: "Max HR",
        value: "189",
        unit: "bpm",
        hint: "Measured max",
      },
    ],
    auto: true,
    zoneUnit: "power",
    zones: [
      { n: 1, name: "Recovery", range: "< 146 W", pct: "< 55%", w: 0.16 },
      { n: 2, name: "Endurance", range: "146–199 W", pct: "56–75%", w: 0.26 },
      { n: 3, name: "Tempo", range: "200–238 W", pct: "76–90%", w: 0.2 },
      { n: 4, name: "Threshold", range: "239–278 W", pct: "91–105%", w: 0.2 },
      { n: 5, name: "VO₂ max", range: "> 278 W", pct: "> 106%", w: 0.18 },
    ],
  },
  running: {
    label: "Running",
    icon: "run",
    metrics: [
      {
        key: "thr",
        label: "Threshold pace",
        value: "4:05",
        unit: "/km",
        hint: "Functional threshold pace",
      },
      {
        key: "lthr",
        label: "Threshold HR",
        value: "172",
        unit: "bpm",
        hint: "Lactate threshold HR",
      },
      {
        key: "max",
        label: "Max HR",
        value: "192",
        unit: "bpm",
        hint: "Measured max",
      },
    ],
    auto: true,
    zoneUnit: "pace",
    zones: [
      { n: 1, name: "Easy", range: "> 5:30 /km", pct: "Recovery", w: 0.18 },
      { n: 2, name: "Endurance", range: "5:00–5:30", pct: "Aerobic", w: 0.26 },
      { n: 3, name: "Tempo", range: "4:30–5:00", pct: "Marathon", w: 0.2 },
      { n: 4, name: "Threshold", range: "4:05–4:30", pct: "Threshold", w: 0.2 },
      { n: 5, name: "Interval", range: "< 4:05 /km", pct: "VO₂ max", w: 0.16 },
    ],
  },
  swimming: {
    label: "Swim",
    icon: "swim",
    metrics: [
      {
        key: "css",
        label: "CSS pace",
        value: "1:38",
        unit: "/100m",
        hint: "Critical swim speed",
      },
      {
        key: "thr",
        label: "Threshold HR",
        value: "160",
        unit: "bpm",
        hint: "Lactate threshold HR",
      },
    ],
    auto: false,
    zoneUnit: "pace",
    zones: [
      { n: 1, name: "Easy", range: "> 1:52", pct: "Recovery", w: 0.18 },
      { n: 2, name: "Aerobic", range: "1:44–1:52", pct: "Endurance", w: 0.26 },
      { n: 3, name: "Tempo", range: "1:38–1:44", pct: "Threshold", w: 0.22 },
      { n: 4, name: "Threshold", range: "1:33–1:38", pct: "CSS", w: 0.18 },
      { n: 5, name: "Sprint", range: "< 1:33", pct: "Max", w: 0.16 },
    ],
  },
};

// Merged "Connections" = Linked Accounts + Data Flows in one concept.
const CONNECTIONS = [
  {
    id: "garmin",
    name: "Garmin Connect",
    status: "connected",
    account: "pablo.albaladejo",
    color: "#0a0a0a",
    mark: "G",
    lastSync: "8 min ago",
    flows: [
      {
        dir: "in",
        label: "Completed activities",
        sub: "Rides & runs flow back in",
        on: true,
      },
      {
        dir: "out",
        label: "Planned workouts",
        sub: "Push sessions to your watch",
        on: true,
      },
      {
        dir: "in",
        label: "Daily readiness",
        sub: "HRV, sleep & body battery",
        on: false,
      },
    ],
  },
  {
    id: "strava",
    name: "Strava",
    status: "available",
    mark: "S",
    color: "#fc4c02",
  },
  {
    id: "wahoo",
    name: "Wahoo",
    status: "available",
    mark: "W",
    color: "#2563eb",
  },
  {
    id: "intervals",
    name: "intervals.icu",
    status: "available",
    mark: "i",
    color: "#16a34a",
  },
];

// Readiness snapshot (from Garmin daily metrics).
const READINESS = {
  score: 82,
  hrv: 68,
  hrvTrend: "+4",
  sleep: "7h 42m",
  battery: 76,
};

// Today's planned session.
const TODAY_SESSION = {
  id: "w-today",
  title: "Sweet Spot 3×12",
  sport: "cycling",
  duration: "1h 05m",
  tss: 78,
  load: "Moderate",
  desc: "Build sustained power below threshold.",
  // zone time distribution (fractions, sums ~1)
  dist: [0.12, 0.3, 0.16, 0.4, 0.02],
  pushed: false,
  steps: [
    { kind: "Warm up", detail: "12 min ramp", zone: 2, dur: "12:00" },
    { kind: "Interval", detail: "3 × 12 min @ 90% FTP", zone: 4, dur: "36:00" },
    { kind: "Recovery", detail: "3 × 4 min easy", zone: 1, dur: "12:00" },
    { kind: "Cool down", detail: "5 min spin", zone: 1, dur: "05:00" },
  ],
};

// Library workouts.
const LIBRARY = [
  {
    id: "l1",
    title: "VO₂ 5×4",
    sport: "cycling",
    duration: "1h 02m",
    tss: 92,
    dist: [0.18, 0.24, 0.06, 0.1, 0.42],
    tag: "Intervals",
  },
  {
    id: "l2",
    title: "Long Endurance",
    sport: "cycling",
    duration: "3h 00m",
    tss: 165,
    dist: [0.1, 0.72, 0.14, 0.04, 0.0],
    tag: "Endurance",
  },
  {
    id: "l3",
    title: "Threshold 2×20",
    sport: "cycling",
    duration: "1h 15m",
    tss: 98,
    dist: [0.14, 0.3, 0.1, 0.46, 0.0],
    tag: "Threshold",
  },
  {
    id: "l4",
    title: "Tempo Run 40′",
    sport: "running",
    duration: "0h 48m",
    tss: 64,
    dist: [0.2, 0.3, 0.46, 0.04, 0.0],
    tag: "Tempo",
  },
  {
    id: "l5",
    title: "Track 8×400",
    sport: "running",
    duration: "0h 52m",
    tss: 71,
    dist: [0.3, 0.2, 0.04, 0.1, 0.36],
    tag: "Speed",
  },
  {
    id: "l6",
    title: "CSS 6×100",
    sport: "swimming",
    duration: "0h 45m",
    tss: 52,
    dist: [0.22, 0.26, 0.16, 0.36, 0.0],
    tag: "Threshold",
  },
];

// Week strip for Today.
const WEEK = [
  { d: "M", n: 26, done: true, load: 0.4 },
  { d: "T", n: 27, done: true, load: 0.9 },
  { d: "W", n: 28, done: true, load: 0.0 },
  { d: "T", n: 29, today: true, load: 0.62 },
  { d: "F", n: 30, load: 0.3 },
  { d: "S", n: 31, load: 1.0 },
  { d: "S", n: 1, load: 0.0 },
];

// AI example prompts for the frictionless create flow.
const AI_EXAMPLES = [
  "45 min Z2 endurance ride",
  "4×4 VO₂ max intervals",
  "Sweet spot 3×12 @ 90%",
  "10k tempo run with strides",
];

// Simulated AI-generated workout preview.
const AI_RESULT = {
  title: "VO₂ Max 4×4",
  sport: "cycling",
  duration: "1h 04m",
  tss: 88,
  load: "Hard",
  dist: [0.16, 0.26, 0.04, 0.1, 0.44],
  steps: [
    { kind: "Warm up", detail: "15 min progressive", zone: 2, dur: "15:00" },
    { kind: "Activation", detail: "3 × 30s spin-ups", zone: 4, dur: "04:30" },
    { kind: "Interval", detail: "4 × 4 min @ 115% FTP", zone: 5, dur: "16:00" },
    { kind: "Recovery", detail: "4 × 4 min @ 50% FTP", zone: 1, dur: "16:00" },
    { kind: "Cool down", detail: "8 min easy spin", zone: 1, dur: "08:00" },
  ],
};

Object.assign(window, {
  ATHLETE,
  SPORTS,
  CONNECTIONS,
  READINESS,
  TODAY_SESSION,
  LIBRARY,
  WEEK,
  AI_EXAMPLES,
  AI_RESULT,
});
