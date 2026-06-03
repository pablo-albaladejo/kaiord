// app.jsx — shell: bottom nav + center FAB, screen routing, overlays, tweaks, mount.
// Depends on all screen files + kt.jsx + ios-frame.jsx + tweaks-panel.jsx.

// keyed by hero color → [accent, bright, dim]
const ACCENTS = {
  "#0284c7": ["#0284c7", "#38bdf8", "#0c4a6e"], // Sky (brand)
  "#7c3aed": ["#7c3aed", "#a78bfa", "#3b1d6e"], // Violet
  "#059669": ["#059669", "#34d399", "#063f30"], // Emerald
  "#e0533d": ["#e0533d", "#fb9a86", "#5e2018"], // Coral
};
const ACCENT_OPTIONS = Object.keys(ACCENTS);

const TABS = [
  { id: "today", icon: "today", label: "Today" },
  { id: "library", icon: "cards", label: "Library" },
  { id: "athlete", icon: "athlete", label: "Athlete" },
  { id: "settings", icon: "gear", label: "Settings" },
];

function BottomNav({ active, onTab, onCreate }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        paddingBottom: 30,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          margin: "0 14px",
          height: 64,
          borderRadius: 24,
          background: "rgba(15,23,42,.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: `1px solid ${KT.hair}`,
          boxShadow: "0 8px 30px rgba(0,0,0,.4)",
          display: "flex",
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        {TABS.map((t, i) => {
          const on = active === t.id;
          // leave a gap in the center for the FAB
          return (
            <React.Fragment key={t.id}>
              {i === 2 && <div style={{ width: 58, flexShrink: 0 }} />}
              <button
                onClick={() => onTab(t.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <Icon
                  name={t.icon}
                  size={23}
                  sw={on ? 2.2 : 1.9}
                  color={on ? KT.accentBri : KT.faint}
                />
                <span
                  style={{
                    fontFamily: KT.font,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: on ? KT.accentBri : KT.faint,
                  }}
                >
                  {t.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      {/* center FAB */}
      <button
        onClick={onCreate}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 50,
          transform: "translateX(-50%)",
          width: 58,
          height: 58,
          borderRadius: 20,
          border: "none",
          cursor: "pointer",
          background: `linear-gradient(160deg, ${KT.accentBri}, ${KT.accent})`,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 8px 22px ${KT.accent}66, inset 0 1px 0 rgba(255,255,255,.3)`,
        }}
      >
        <Icon name="plus" size={28} color="#fff" sw={2.6} />
      </button>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // apply accent + bg into the shared token object (inline styles read it at render)
  const acc = ACCENTS[t.accent] || ACCENTS["#0284c7"];
  KT.accent = acc[0];
  KT.accentBri = acc[1];
  KT.accentDim = acc[2];
  KT.bg = t.pureBlack ? "#05070d" : "#0b1220";

  const [tab, setTab] = React.useState("today");
  const [creating, setCreating] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const openWorkout = (w) => setDetail(w);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const screen = {
    today: <TodayScreen onOpenWorkout={openWorkout} />,
    library: <LibraryScreen onOpenWorkout={openWorkout} />,
    athlete: <AthleteScreen />,
    settings: <SettingsScreen />,
  }[tab];

  const Shell = (
    <div
      style={{
        position: "relative",
        height: "100%",
        background: KT.bg,
        overflow: "hidden",
      }}
    >
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -40,
          width: 240,
          height: 240,
          borderRadius: 999,
          background: `radial-gradient(circle, ${KT.accent}22, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* scrollable screen */}
      <div
        key={tab}
        className="kd-fade"
        style={{
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          paddingTop: 54,
          paddingBottom: 110,
        }}
      >
        {screen}
      </div>

      <BottomNav
        active={tab}
        onTab={setTab}
        onCreate={() => setCreating(true)}
      />

      {/* create overlay */}
      {creating && (
        <div
          className="kd-sheet"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 60,
            background: KT.bg,
            paddingTop: 40,
          }}
        >
          <CreateScreen
            onClose={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              showToast("Saved & pushed to Garmin");
            }}
          />
        </div>
      )}

      {/* detail overlay */}
      {detail && (
        <div
          className="kd-sheet"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 55,
            background: KT.bg,
            paddingTop: 40,
          }}
        >
          <WorkoutDetail w={detail} onClose={() => setDetail(null)} />
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          className="kd-toast"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 120,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 16px",
            borderRadius: 16,
            background: "rgba(15,23,42,.95)",
            border: `1px solid ${KT.hair}`,
            boxShadow: "0 10px 30px rgba(0,0,0,.5)",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: "rgba(52,211,153,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="check" size={16} color={KT.tip} sw={2.6} />
          </div>
          <span
            style={{
              fontFamily: KT.font,
              fontSize: 14.5,
              fontWeight: 600,
              color: KT.text,
            }}
          >
            {toast}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        boxSizing: "border-box",
        gap: 18,
      }}
    >
      {t.frame ? (
        <IOSDevice dark>{Shell}</IOSDevice>
      ) : (
        <div
          style={{
            width: 402,
            height: 844,
            borderRadius: 30,
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 30px 70px rgba(0,0,0,.4)",
            border: `1px solid ${KT.hair}`,
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>{Shell}</div>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakToggle
          label="Pure-black bg"
          value={t.pureBlack}
          onChange={(v) => setTweak("pureBlack", v)}
        />
        <TweakSection label="Presentation" />
        <TweakToggle
          label="iPhone frame"
          value={t.frame}
          onChange={(v) => setTweak("frame", v)}
        />
      </TweaksPanel>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accent: "#0284c7",
  pureBlack: false,
  frame: true,
}; /*EDITMODE-END*/

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
