// screen-misc.jsx — Today, Library, WorkoutDetail (Push to Garmin), Settings.
// Depends on kt.jsx, data.jsx, viz.jsx, screen-create.jsx (StepList/SummaryStrip).

// ── Push-to-Garmin button with its own idle→pushing→done state ──────
function PushButton({ pushed, size = "lg", full }) {
  const [state, setState] = React.useState(pushed ? "done" : "idle");
  if (state === "done") {
    return (
      <Btn
        variant="soft"
        size={size}
        full={full}
        icon="check"
        style={{
          background: "rgba(52,211,153,.12)",
          color: KT.tip,
          cursor: "default",
        }}
      >
        On your Garmin
      </Btn>
    );
  }
  return (
    <Btn
      size={size}
      full={full}
      icon={state === "pushing" ? null : "watch"}
      onClick={() => {
        setState("pushing");
        setTimeout(() => setState("done"), 1300);
      }}
    >
      {state === "pushing" ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span
            className="kd-spin"
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,.4)",
              borderTopColor: "#fff",
            }}
          />{" "}
          Pushing…
        </span>
      ) : (
        "Push to Garmin"
      )}
    </Btn>
  );
}

// ── Readiness ring ──────────────────────────────────────────────────
function ReadinessRing({ score, size = 76 }) {
  const r = (size - 10) / 2,
    c = 2 * Math.PI * r;
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={KT.elevated}
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={KT.tip}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: KT.font,
            fontSize: 22,
            fontWeight: 750,
            color: KT.text,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily: KT.font,
            fontSize: 9.5,
            fontWeight: 600,
            color: KT.faint,
            marginTop: 1,
          }}
        >
          READY
        </span>
      </div>
    </div>
  );
}

function ScreenHeader({ eyebrow, title, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "6px 16px 18px",
      }}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 13.5,
              color: KT.muted,
              marginBottom: 3,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontFamily: KT.font,
            fontSize: 28,
            fontWeight: 780,
            letterSpacing: "-.02em",
            color: KT.text,
          }}
        >
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

// ── TODAY ───────────────────────────────────────────────────────────
function TodayScreen({ onOpenWorkout }) {
  const s = TODAY_SESSION;
  return (
    <div style={{ paddingBottom: 20 }}>
      <ScreenHeader
        eyebrow="Thursday, May 29"
        title="Today"
        action={
          <button
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,.05)",
              border: `1px solid ${KT.hair}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="bell" size={19} color={KT.textSec} sw={1.8} />
          </button>
        }
      />

      <div style={{ padding: "0 16px" }}>
        {/* readiness */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ReadinessRing score={READINESS.score} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: KT.font,
                  fontSize: 15,
                  fontWeight: 700,
                  color: KT.text,
                }}
              >
                Good to push today
              </div>
              <div
                style={{
                  fontFamily: KT.font,
                  fontSize: 12.5,
                  color: KT.muted,
                  marginTop: 2,
                  marginBottom: 11,
                }}
              >
                Recovery is on track — green light for intensity.
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  { l: "HRV", v: READINESS.hrv, t: READINESS.hrvTrend },
                  { l: "Sleep", v: READINESS.sleep },
                  { l: "Battery", v: READINESS.battery },
                ].map((m) => (
                  <div key={m.l}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: KT.font,
                          fontSize: 15,
                          fontWeight: 700,
                          color: KT.text,
                        }}
                      >
                        {m.v}
                      </span>
                      {m.t && (
                        <span
                          style={{
                            fontFamily: KT.font,
                            fontSize: 11,
                            fontWeight: 600,
                            color: KT.tip,
                          }}
                        >
                          {m.t}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: KT.font,
                        fontSize: 11,
                        color: KT.faint,
                      }}
                    >
                      {m.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* week strip */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {WEEK.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                padding: "10px 0",
                borderRadius: 14,
                background: d.today ? KT.accentDim : "transparent",
                border: d.today
                  ? `1px solid rgba(56,189,248,.3)`
                  : "1px solid transparent",
              }}
            >
              <span
                style={{
                  fontFamily: KT.font,
                  fontSize: 11,
                  fontWeight: 600,
                  color: d.today ? KT.accentBri : KT.faint,
                }}
              >
                {d.d}
              </span>
              <span
                style={{
                  fontFamily: KT.font,
                  fontSize: 14,
                  fontWeight: 700,
                  color: d.today ? KT.text : KT.textSec,
                }}
              >
                {d.n}
              </span>
              <div
                style={{
                  width: 6,
                  height: 28,
                  borderRadius: 9,
                  background: KT.bgAlt,
                  display: "flex",
                  alignItems: "flex-end",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${d.load * 100}%`,
                    background: d.done
                      ? KT.faint
                      : d.today
                        ? KT.accentBri
                        : KT.elevated,
                    borderRadius: 9,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* today's session hero */}
        <SectionHead title="Planned session" action="Reschedule" />
        <Card pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: KT.bgAlt,
                  border: `1px solid ${KT.hair}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={SPORT_ICON[s.sport]}
                  size={23}
                  color={KT.accentBri}
                  sw={1.9}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: KT.font,
                    fontSize: 17,
                    fontWeight: 700,
                    color: KT.text,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: KT.font,
                    fontSize: 12.5,
                    color: KT.muted,
                    marginTop: 1,
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
              {[
                { i: "clock", v: s.duration },
                { i: "flame", v: `${s.tss} TSS` },
                { i: "zap", v: s.load },
              ].map((m, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: KT.font,
                    fontSize: 13,
                    color: KT.textSec,
                    fontWeight: 600,
                  }}
                >
                  <Icon name={m.i} size={15} color={KT.faint} sw={2} />
                  {m.v}
                </span>
              ))}
            </div>
            <ZoneDist dist={s.dist} height={9} />
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: 14,
              borderTop: `1px solid ${KT.hair2}`,
              background: "rgba(255,255,255,.015)",
            }}
          >
            <Btn
              variant="ghost"
              icon="chevR"
              onClick={() => onOpenWorkout(s)}
              style={{ flex: 1 }}
            >
              Details
            </Btn>
            <div style={{ flex: 1.4 }}>
              <PushButton pushed={s.pushed} full />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── LIBRARY ─────────────────────────────────────────────────────────
function LibraryScreen({ onOpenWorkout }) {
  const [filter, setFilter] = React.useState("all");
  const filtered =
    filter === "all" ? LIBRARY : LIBRARY.filter((w) => w.sport === filter);
  const chips = [
    { value: "all", label: "All" },
    { value: "cycling", label: "Cycling" },
    { value: "running", label: "Running" },
    { value: "swimming", label: "Swim" },
  ];
  return (
    <div style={{ paddingBottom: 20 }}>
      <ScreenHeader
        title="Library"
        action={
          <span
            style={{
              fontFamily: KT.font,
              fontSize: 13.5,
              color: KT.muted,
              fontWeight: 600,
            }}
          >
            {LIBRARY.length} workouts
          </span>
        }
      />
      <div style={{ padding: "0 16px" }}>
        {/* search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: KT.bgAlt,
            border: `1px solid ${KT.hair2}`,
            borderRadius: 14,
            marginBottom: 14,
          }}
        >
          <Icon name="target" size={17} color={KT.faint} sw={1.9} />
          <span
            style={{ fontFamily: KT.font, fontSize: 14.5, color: KT.faint }}
          >
            Search workouts
          </span>
        </div>
        {/* filter chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            overflowX: "auto",
          }}
        >
          {chips.map((c) => {
            const active = filter === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setFilter(c.value)}
                style={{
                  padding: "8px 15px",
                  borderRadius: 999,
                  background: active ? KT.accent : "rgba(255,255,255,.04)",
                  border: `1px solid ${active ? "transparent" : KT.hair2}`,
                  color: active ? "#fff" : KT.textSec,
                  fontFamily: KT.font,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((w) => (
            <WorkoutCard key={w.id} w={w} onClick={() => onOpenWorkout(w)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── WORKOUT DETAIL (overlay) ────────────────────────────────────────
function WorkoutDetail({ w, onClose }) {
  // build steps if missing (library cards have no steps)
  const steps = w.steps || TODAY_SESSION.steps;
  const dur = w.duration,
    tss = w.tss,
    load = w.load || "Moderate";
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px 10px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "rgba(255,255,255,.06)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="chevL" size={19} color={KT.textSec} sw={2.2} />
        </button>
        <span
          style={{
            flex: 1,
            fontFamily: KT.font,
            fontSize: 16,
            fontWeight: 700,
            color: KT.text,
          }}
        >
          Workout
        </span>
        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "rgba(255,255,255,.06)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="dots" size={19} color={KT.textSec} sw={2.2} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "4px 16px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              background: KT.accentDim,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              name={SPORT_ICON[w.sport]}
              size={26}
              color={KT.accentBri}
              sw={1.9}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: KT.font,
                fontSize: 21,
                fontWeight: 750,
                color: KT.text,
              }}
            >
              {w.title}
            </div>
            <div
              style={{
                fontFamily: KT.font,
                fontSize: 13,
                color: KT.muted,
                marginTop: 1,
              }}
            >
              {SPORTS[w.sport].label} · {w.tag || "Planned today"}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <SummaryStrip w={{ duration: dur, tss, load }} />
        </div>

        <Card pad={14}>
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              color: KT.faint,
              marginBottom: 10,
            }}
          >
            Structure · time in zone
          </div>
          <ZoneDist dist={w.dist} height={10} />
          <div style={{ marginTop: 14 }}>
            <StepList steps={steps} />
          </div>
        </Card>
      </div>
      {/* sticky push */}
      <div
        style={{
          padding: 16,
          borderTop: `1px solid ${KT.hair2}`,
          background: KT.bg,
          display: "flex",
          gap: 10,
        }}
      >
        <Btn variant="ghost" icon="edit" style={{ flex: 1 }}>
          Edit
        </Btn>
        <div style={{ flex: 1.6 }}>
          <PushButton pushed={false} full />
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS (flattened) ────────────────────────────────────────────
function SettingsScreen() {
  const groups = [
    {
      title: "AI generation",
      rows: [
        { icon: "sparkle", label: "Provider", detail: "Claude · default" },
        { icon: "edit", label: "Custom instructions", detail: "" },
      ],
    },
    {
      title: "Preferences",
      rows: [
        { icon: "target", label: "Units", detail: "Metric" },
        { icon: "bell", label: "Notifications", detail: "On" },
      ],
    },
    {
      title: "Privacy & data",
      rows: [
        { icon: "shield", label: "Data & privacy", detail: "" },
        { icon: "upload", label: "Export everything", detail: "" },
      ],
    },
  ];
  return (
    <div style={{ paddingBottom: 20 }}>
      <ScreenHeader title="Settings" />
      <div style={{ padding: "0 16px" }}>
        {groups.map((g) => (
          <div key={g.title} style={{ marginBottom: 22 }}>
            <SectionHead title={g.title} />
            <Card pad={0} style={{ overflow: "hidden" }}>
              {g.rows.map((r, i) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    padding: "14px 14px",
                    borderBottom:
                      i < g.rows.length - 1 ? `1px solid ${KT.hair2}` : "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: KT.bgAlt,
                      border: `1px solid ${KT.hair2}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      name={r.icon}
                      size={18}
                      color={KT.accentBri}
                      sw={1.8}
                    />
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: KT.font,
                      fontSize: 15,
                      fontWeight: 600,
                      color: KT.text,
                    }}
                  >
                    {r.label}
                  </span>
                  {r.detail && (
                    <span
                      style={{
                        fontFamily: KT.font,
                        fontSize: 13.5,
                        color: KT.muted,
                      }}
                    >
                      {r.detail}
                    </span>
                  )}
                  <Icon name="chevR" size={17} color={KT.faint} sw={2} />
                </div>
              ))}
            </Card>
          </div>
        ))}
        <div
          style={{
            textAlign: "center",
            fontFamily: KT.font,
            fontSize: 12,
            color: KT.faint,
            marginTop: 6,
          }}
        >
          Kaiord · v2.0 redesign
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  TodayScreen,
  LibraryScreen,
  WorkoutDetail,
  SettingsScreen,
  PushButton,
});
