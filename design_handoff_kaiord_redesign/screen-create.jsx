// screen-create.jsx — frictionless create. AI-first: describe → generate → preview.
// Also exports StepList + SummaryStrip reused in the workout detail.
// Depends on kt.jsx, data.jsx, viz.jsx.

function StepList({ steps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "12px 2px",
            borderBottom:
              i < steps.length - 1 ? `1px solid ${KT.hair2}` : "none",
          }}
        >
          <div
            style={{
              width: 4,
              alignSelf: "stretch",
              borderRadius: 9,
              background: ZONE_COLORS[s.zone - 1],
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: KT.font,
                fontSize: 14.5,
                fontWeight: 650,
                color: KT.text,
              }}
            >
              {s.kind}
            </div>
            <div
              style={{
                fontFamily: KT.font,
                fontSize: 12.5,
                color: KT.muted,
                marginTop: 1,
              }}
            >
              {s.detail}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: KT.font,
                fontSize: 14,
                fontWeight: 600,
                color: KT.textSec,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.dur}
            </div>
            <div style={{ fontFamily: KT.font, fontSize: 11, color: KT.faint }}>
              Z{s.zone}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryStrip({ w }) {
  const items = [
    { icon: "clock", value: w.duration, label: "Duration" },
    { icon: "flame", value: w.tss, label: "TSS" },
    { icon: "zap", value: w.load, label: "Load" },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: KT.bgAlt,
            border: `1px solid ${KT.hair2}`,
            borderRadius: 14,
            padding: "12px 10px",
            textAlign: "center",
          }}
        >
          <Icon
            name={it.icon}
            size={16}
            color={KT.faint}
            sw={2}
            style={{ margin: "0 auto 5px" }}
          />
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 16,
              fontWeight: 700,
              color: KT.text,
            }}
          >
            {it.value}
          </div>
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 11,
              color: KT.faint,
              marginTop: 1,
            }}
          >
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneratingState() {
  return (
    <div style={{ padding: "40px 8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          marginBottom: 24,
        }}
      >
        <div
          className="kd-spin"
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            border: `2.5px solid ${KT.accentDim}`,
            borderTopColor: KT.accentBri,
          }}
        />
        <span
          style={{
            fontFamily: KT.font,
            fontSize: 15,
            fontWeight: 600,
            color: KT.textSec,
          }}
        >
          Designing your session…
        </span>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="kd-shimmer"
          style={{
            height: 52,
            borderRadius: 12,
            marginBottom: 10,
            background: KT.surface,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function CreateScreen({ onClose, onSaved }) {
  const [phase, setPhase] = React.useState("input");
  const [text, setText] = React.useState("");
  const [sportKey, setSportKey] = React.useState("cycling");
  const w = AI_RESULT;

  const generate = () => {
    if (!text.trim()) return;
    setPhase("generating");
    setTimeout(() => setPhase("result"), 1700);
  };

  const sportOpts = Object.keys(SPORTS).map((k) => ({
    value: k,
    label: SPORTS[k].label,
    icon: SPORTS[k].icon,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* sheet header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 12px",
        }}
      >
        <span
          style={{
            fontFamily: KT.font,
            fontSize: 18,
            fontWeight: 750,
            color: KT.text,
          }}
        >
          {phase === "result" ? "Review session" : "New session"}
        </span>
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
          <Icon name="x" size={18} color={KT.textSec} sw={2.2} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px" }}>
        {phase === "input" && (
          <>
            <Segmented
              options={sportOpts}
              value={sportKey}
              onChange={setSportKey}
              style={{ marginBottom: 16 }}
            />

            {/* AI prompt — the hero */}
            <div
              style={{
                background: KT.surface,
                border: `1px solid ${KT.hair}`,
                borderRadius: 20,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Icon
                  name="sparkle"
                  size={18}
                  color={KT.accentBri}
                  sw={1.8}
                  fill={KT.accentBri}
                />
                <span
                  style={{
                    fontFamily: KT.font,
                    fontSize: 14.5,
                    fontWeight: 650,
                    color: KT.text,
                  }}
                >
                  Describe it in plain words
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="e.g. 4×4 VO₂ max intervals with a long warm-up…"
                style={{
                  width: "100%",
                  resize: "none",
                  background: KT.bgAlt,
                  border: `1px solid ${KT.hair2}`,
                  borderRadius: 13,
                  padding: 13,
                  color: KT.text,
                  fontFamily: KT.font,
                  fontSize: 15,
                  lineHeight: 1.45,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 7,
                  marginTop: 12,
                }}
              >
                {AI_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setText(ex)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.04)",
                      border: `1px solid ${KT.hair2}`,
                      cursor: "pointer",
                      color: KT.textSec,
                      fontFamily: KT.font,
                      fontSize: 12.5,
                      fontWeight: 500,
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <Btn
                  full
                  size="lg"
                  icon="sparkle"
                  onClick={generate}
                  style={{ opacity: text.trim() ? 1 : 0.5 }}
                >
                  Generate workout
                </Btn>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 11,
                  justifyContent: "center",
                }}
              >
                <Icon name="target" size={13} color={KT.faint} sw={2} />
                <span
                  style={{
                    fontFamily: KT.font,
                    fontSize: 11.5,
                    color: KT.faint,
                  }}
                >
                  Built around your {SPORTS[sportKey].label.toLowerCase()} zones
                </span>
              </div>
            </div>

            {/* other ways */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "18px 0 14px",
              }}
            >
              <div style={{ flex: 1, height: 1, background: KT.hair2 }} />
              <span
                style={{ fontFamily: KT.font, fontSize: 12, color: KT.faint }}
              >
                or start from
              </span>
              <div style={{ flex: 1, height: 1, background: KT.hair2 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { icon: "cards", label: "Template" },
                { icon: "edit", label: "Blank" },
                { icon: "upload", label: "Import file" },
              ].map((o) => (
                <button
                  key={o.label}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 9,
                    padding: "16px 8px",
                    borderRadius: 16,
                    background: KT.surface,
                    border: `1px solid ${KT.hair}`,
                    cursor: "pointer",
                  }}
                >
                  <Icon name={o.icon} size={22} color={KT.textSec} sw={1.8} />
                  <span
                    style={{
                      fontFamily: KT.font,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: KT.textSec,
                    }}
                  >
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "generating" && <GeneratingState />}

        {phase === "result" && (
          <div className="kd-fade">
            {/* title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: KT.accentDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={SPORT_ICON[w.sport]}
                  size={24}
                  color={KT.accentBri}
                  sw={1.9}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: KT.font,
                      fontSize: 19,
                      fontWeight: 750,
                      color: KT.text,
                    }}
                  >
                    {w.title}
                  </span>
                  <Pill
                    icon="sparkle"
                    color={KT.accentBri}
                    bg={KT.accentDim}
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    AI
                  </Pill>
                </div>
                <span
                  style={{ fontFamily: KT.font, fontSize: 13, color: KT.muted }}
                >
                  Tap any step to fine-tune
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <SummaryStrip w={w} />
            </div>

            <Card style={{ marginBottom: 14 }} pad={14}>
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
                Time in zone
              </div>
              <ZoneDist dist={w.dist} height={10} />
              <div style={{ marginTop: 14 }}>
                <StepList steps={w.steps} />
              </div>
            </Card>

            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                variant="ghost"
                icon="sync"
                onClick={() => setPhase("input")}
                style={{ flex: 1 }}
              >
                Redo
              </Btn>
              <Btn icon="check" onClick={onSaved} style={{ flex: 2 }}>
                Save & push
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CreateScreen, StepList, SummaryStrip });
