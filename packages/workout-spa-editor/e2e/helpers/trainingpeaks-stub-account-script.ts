/**
 * Page-side TrainingPeaks account for the Kaiord for TrainingPeaks stub:
 * `request` on the closed list (the workout write, one workout by id, one
 * day of workouts) over state kept in `localStorage`, shared by every page
 * of the context. `hangPushes` workout writes land and get no answer
 * (`undefined`). Registered on `window.__TP_STUB__`; self-contained, as
 * Playwright serialises it, but for the answer builders
 * (`installTrainingPeaksAnswersScript`, installed first).
 */
export const installTrainingPeaksAnswersScript = (): void => {
  (window as unknown as Record<string, unknown>).__TP_STUB_ANSWERS__ = {
    raw: (payload: unknown) => ({
      ok: true,
      protocolVersion: 2,
      data: {
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      },
    }),
    refuse: (error: string, extra: Record<string, unknown> = {}) => ({
      ok: false,
      protocolVersion: 2,
      error,
      ...extra,
    }),
  };
};
export const TRAININGPEAKS_STUB_STATE_KEY = "__TP_STUB_STATE__";

export const installTrainingPeaksAccountScript = (args: {
  hangPushes: number;
}): void => {
  type Msg = Record<string, unknown>;
  type Workout = Msg & { workoutId: number; workoutDay?: unknown };
  type State = {
    nextId: number;
    hangs: number;
    workouts: Workout[];
    requests: { method: string; path: string }[];
  };
  const KEY = "__TP_STUB_STATE__";
  const base = "/fitness/v6/athletes/77/workouts";
  const load = (): State =>
    (JSON.parse(localStorage.getItem(KEY) ?? "null") as State | null) ?? {
      nextId: 5000,
      hangs: args.hangPushes,
      workouts: [],
      requests: [],
    };
  type Answers = {
    raw: (payload: unknown) => unknown;
    refuse: (error: string, extra?: Msg) => unknown;
  };
  const { raw, refuse } = (window as unknown as Record<string, unknown>)
    .__TP_STUB_ANSWERS__ as Answers;
  const day = new RegExp(`^${base}/(\\d{4}-\\d{2}-\\d{2})/\\1$`);
  const one = new RegExp(`^${base}/(\\d+)$`);
  const answer = (s: State, method: string, path: string, body: unknown) => {
    if (method === "POST" && path === base) {
      const w = { ...(body as Msg), workoutId: s.nextId++ } as Workout;
      s.workouts.push(w);
      if (s.hangs <= 0) return raw(w);
      s.hangs -= 1;
      return undefined;
    }
    const d = day.exec(path)?.[1];
    if (method === "GET" && d)
      return raw(
        s.workouts
          .filter((w) => String(w.workoutDay).slice(0, 10) === d)
          .map((w) => ({ ...w, workoutDay: `${d}T00:00:00` }))
      );
    const id = Number(one.exec(path)?.[1]);
    const found = s.workouts.find((w) => w.workoutId === id);
    if (method === "GET" && id)
      return found
        ? raw(found)
        : refuse("Request failed: 404", { status: 404 });
    return refuse("Request not allowed", { retryable: false });
  };
  (window as unknown as Record<string, unknown>).__TP_STUB__ = (m: Msg) => {
    const s = load();
    const [method, path] = [String(m.method), String(m.path)];
    s.requests.push({ method, path });
    const r = answer(s, method, path, m.body);
    localStorage.setItem(KEY, JSON.stringify(s));
    return r;
  };
};
