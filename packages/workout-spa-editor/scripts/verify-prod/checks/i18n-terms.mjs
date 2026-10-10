// English UI terms the audit found in the Spanish locale (F-02, F-13, F-19,
// F-35, F-39, F-46b). Matched case-sensitively on word boundaries.
// prettier-ignore
export const BLACKLIST = [
  "Today", "Add", "Previous week", "Next week", "Athlete", "Save", "Cancel",
  "Schedule", "Workout", "Step", "Steps", "steps", "Duration", "Distance",
  "Weight", "Sleep score", "Untracked", "MEASURED", "Manual Entry",
  "Profile Manager", "Create Profile", "Import Profile", "Saved Profiles",
  "Recovery", "Aerobic", "Threshold", "Pick a date", "Set energy goal",
  "Wellness", "Import a file", "Paste Step", "Coaching Cues", "Time",
  "Running", "Cycling", "Swim", "New workout", "Block actions", "Focus",
  "Loading", "Delete", "Edit", "Close", "Settings", "Generic",
];

// Proper nouns and format names that legitimately stay in English. They are
// removed from the text before the blacklist runs.
// prettier-ignore
export const ALLOWLIST = [
  "Kaiord", "Garmin Connect", "Garmin", "Train2Go", "TrainingPeaks", "WHOOP",
  "Google Drive", "Umami", "Zwift", "MyTANITA", "Tanita", "Claude", "OpenAI",
  "Gemini", "Anthropic", "Chrome Web Store",
];

export const PATTERNS = [
  {
    name: "English week letters (M T W T F S S)",
    re: /\bM\s+(\d{1,2}\s+)?T\s+(\d{1,2}\s+)?W\b/,
  },
  {
    name: "English month-day date",
    re: /\b(Jan|Feb|Apr|Aug|Sep|Oct|Dec) \d{1,2}\b/,
  },
  { name: "English weekday", re: /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}\b/ },
];

// F-26: internal design notes that leaked into the UI.
export const DESIGN_NOTES = [
  "El ancho es el rango de la zona",
  "Las series se distinguen por luminosidad",
  "Se marca sola según avanzas",
];

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findEnglish(raw) {
  let text = raw;
  for (const term of ALLOWLIST) text = text.split(term).join(" ");
  const hits = new Set();
  for (const term of BLACKLIST) {
    if (new RegExp(`(^|[^\\p{L}])${escape(term)}(?![\\p{L}])`, "u").test(text))
      hits.add(term);
  }
  for (const { name, re } of PATTERNS) {
    const m = text.match(re);
    if (m) hits.add(`${name}: "${m[0]}"`);
  }
  return [...hits];
}
