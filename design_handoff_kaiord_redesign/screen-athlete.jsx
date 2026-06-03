// screen-athlete.jsx — the reimagined Profile. One coherent scroll page:
// athlete identity → sport selector → thresholds → zone map → connections
// (Linked Accounts + Data Flows merged). Depends on kt.jsx, data.jsx, viz.jsx.

function AvatarRing({ initials, size = 64 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        background: `conic-gradient(from 200deg, ${KT.accent}, ${KT.purple}, ${KT.accentBri}, ${KT.accent})`,
        padding: 2.5,
        display: "flex",
      }}
    >
      <div
        style={{
          flex: 1,
          borderRadius: 999,
          background: KT.bgAlt,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: KT.font,
            fontSize: size * 0.34,
            fontWeight: 750,
            color: KT.text,
          }}
        >
          {initials}
        </span>
      </div>
    </div>
  );
}

function ThresholdCard({ sport, auto, onAuto }) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="target" size={18} color={KT.accentBri} sw={1.9} />
          <span
            style={{
              fontFamily: KT.font,
              fontSize: 15,
              fontWeight: 650,
              color: KT.text,
            }}
          >
            Thresholds
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              fontFamily: KT.font,
              fontSize: 13,
              color: auto ? KT.accentBri : KT.muted,
              fontWeight: 600,
            }}
          >
            {auto ? "Auto zones" : "Manual zones"}
          </span>
          <Toggle on={auto} onChange={onAuto} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {sport.metrics.map((m, i) => (
          <React.Fragment key={m.key}>
            {i > 0 && <div style={{ width: 1, background: KT.hair2 }} />}
            <Metric
              value={m.value}
              unit={m.unit}
              label={m.label}
              accent={i === 0}
            />
          </React.Fragment>
        ))}
      </div>
      <button
        style={{
          marginTop: 14,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          padding: "10px",
          borderRadius: 12,
          background: "rgba(255,255,255,.04)",
          border: `1px solid ${KT.hair2}`,
          cursor: "pointer",
          color: KT.textSec,
          fontFamily: KT.font,
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        <Icon name="edit" size={15} sw={2} color={KT.muted} /> Edit thresholds
      </button>
    </Card>
  );
}

function ConnectionRow({ conn, expanded, onToggle, flows, onFlow }) {
  const connected = conn.status === "connected";
  return (
    <div
      style={{
        background: KT.surface,
        border: `1px solid ${expanded ? KT.hair : KT.hair}`,
        borderRadius: 18,
        overflow: "hidden",
        transition: "border-color .2s ease",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            flexShrink: 0,
            background: conn.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${KT.hair}`,
            fontFamily: KT.font,
            fontSize: 19,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          {conn.mark}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 15,
              fontWeight: 650,
              color: KT.text,
            }}
          >
            {conn.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            {connected ? (
              <>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9,
                    background: KT.tip,
                  }}
                />
                <span
                  style={{
                    fontFamily: KT.font,
                    fontSize: 12.5,
                    color: KT.muted,
                  }}
                >
                  Synced {conn.lastSync}
                </span>
              </>
            ) : (
              <span
                style={{ fontFamily: KT.font, fontSize: 12.5, color: KT.faint }}
              >
                Not connected
              </span>
            )}
          </div>
        </div>
        {connected ? (
          <Icon
            name="chevD"
            size={18}
            color={KT.faint}
            style={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform .2s ease",
            }}
          />
        ) : (
          <Pill
            icon="plus"
            color={KT.accentBri}
            bg={KT.accentDim}
            style={{ padding: "6px 11px" }}
          >
            Connect
          </Pill>
        )}
      </button>

      {connected && expanded && (
        <div style={{ padding: "4px 14px 14px" }}>
          <div
            style={{ height: 1, background: KT.hair2, margin: "0 0 10px" }}
          />
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: ".07em",
              textTransform: "uppercase",
              color: KT.faint,
              marginBottom: 8,
            }}
          >
            What syncs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {flows.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "7px 0",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flexShrink: 0,
                    background:
                      f.dir === "in"
                        ? "rgba(52,211,153,.12)"
                        : "rgba(56,189,248,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    name={f.dir === "in" ? "arrowDown" : "arrowUp"}
                    size={16}
                    sw={2.3}
                    color={f.dir === "in" ? KT.tip : KT.accentBri}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: KT.font,
                      fontSize: 14,
                      fontWeight: 600,
                      color: KT.text,
                    }}
                  >
                    {f.label}
                  </div>
                  <div
                    style={{
                      fontFamily: KT.font,
                      fontSize: 12,
                      color: KT.faint,
                    }}
                  >
                    {f.sub}
                  </div>
                </div>
                <Toggle on={f.on} onChange={() => onFlow(i)} />
              </div>
            ))}
          </div>
          <button
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: KT.danger,
              fontFamily: KT.font,
              fontSize: 13,
              fontWeight: 600,
              padding: 0,
            }}
          >
            <Icon name="x" size={14} sw={2.4} /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function AthleteScreen() {
  const [sportKey, setSportKey] = React.useState("cycling");
  const [auto, setAuto] = React.useState(true);
  const [expanded, setExpanded] = React.useState("garmin");
  const [flowState, setFlowState] = React.useState(() =>
    CONNECTIONS.find((c) => c.id === "garmin").flows.map((f) => f.on)
  );
  const sport = SPORTS[sportKey];

  const sportOpts = Object.keys(SPORTS).map((k) => ({
    value: k,
    label: SPORTS[k].label,
    icon: SPORTS[k].icon,
  }));

  return (
    <div style={{ padding: "0 16px 20px" }}>
      {/* identity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 15,
          padding: "4px 2px 22px",
        }}
      >
        <AvatarRing initials={ATHLETE.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 21,
              fontWeight: 750,
              color: KT.text,
              letterSpacing: "-.01em",
            }}
          >
            {ATHLETE.name}
          </div>
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 13.5,
              color: KT.muted,
              marginTop: 2,
            }}
          >
            {ATHLETE.tagline}
          </div>
        </div>
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
          <Icon name="edit" size={18} color={KT.textSec} sw={1.9} />
        </button>
      </div>

      {/* sport selector */}
      <Segmented
        options={sportOpts}
        value={sportKey}
        onChange={setSportKey}
        style={{ marginBottom: 18 }}
      />

      {/* thresholds */}
      <div style={{ marginBottom: 18 }}>
        <ThresholdCard sport={sport} auto={auto} onAuto={setAuto} />
      </div>

      {/* zone map */}
      <div style={{ marginBottom: 26 }}>
        <SectionHead title={`${sport.label} zones`} action="How it's used" />
        <Card>
          <ZoneMap zones={sport.zones} unit={sport.zoneUnit} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginTop: 14,
              padding: "11px 12px",
              background: "rgba(56,189,248,.07)",
              border: `1px solid rgba(56,189,248,.15)`,
              borderRadius: 12,
            }}
          >
            <Icon
              name="sparkle"
              size={17}
              color={KT.accentBri}
              sw={1.8}
              fill={KT.accentBri}
            />
            <span
              style={{
                fontFamily: KT.font,
                fontSize: 12.5,
                color: KT.textSec,
                lineHeight: 1.4,
              }}
            >
              These zones power AI workout generation and every target you push
              to Garmin.
            </span>
          </div>
        </Card>
      </div>

      {/* connections — merged accounts + data flows */}
      <SectionHead title="Connections" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CONNECTIONS.map((c) => (
          <ConnectionRow
            key={c.id}
            conn={c}
            expanded={expanded === c.id}
            onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
            flows={
              c.id === "garmin"
                ? c.flows.map((f, i) => ({ ...f, on: flowState[i] }))
                : []
            }
            onFlow={(i) =>
              setFlowState((s) => s.map((v, j) => (j === i ? !v : v)))
            }
          />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AthleteScreen });
