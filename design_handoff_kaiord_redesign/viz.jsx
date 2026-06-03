// viz.jsx — zone visualizations + workout cards. Depends on kt.jsx, data.jsx.

// Big zone map for the Athlete page: proportional stacked segments,
// each labelled with zone number, name, and range.
function ZoneMap({ zones, unit }) {
  return (
    <div>
      {/* stacked bar */}
      <div style={{ display: "flex", gap: 3, height: 56, marginBottom: 14 }}>
        {zones.map((z, i) => (
          <div
            key={z.n}
            style={{
              flex: z.w,
              position: "relative",
              borderRadius:
                i === 0
                  ? "8px 3px 3px 8px"
                  : i === zones.length - 1
                    ? "3px 8px 8px 3px"
                    : 3,
              background: `linear-gradient(180deg, ${ZONE_COLORS[i]}, ${ZONE_COLORS[i]}cc)`,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 6,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,.18)`,
            }}
          >
            <span
              style={{
                fontFamily: KT.font,
                fontSize: 12,
                fontWeight: 800,
                color: "rgba(0,0,0,.55)",
              }}
            >
              Z{z.n}
            </span>
          </div>
        ))}
      </div>
      {/* legend rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {zones.map((z, i) => (
          <div
            key={z.n}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "8px 4px",
              borderBottom:
                i < zones.length - 1 ? `1px solid ${KT.hair2}` : "none",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                background: ZONE_COLORS[i],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: KT.font,
                fontSize: 14.5,
                fontWeight: 600,
                color: KT.text,
                width: 86,
              }}
            >
              {z.name}
            </span>
            <span
              style={{
                fontFamily: KT.font,
                fontSize: 13,
                color: KT.faint,
                flex: 1,
              }}
            >
              {z.pct}
            </span>
            <span
              style={{
                fontFamily: KT.font,
                fontSize: 13.5,
                fontWeight: 600,
                color: KT.textSec,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {z.range}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact time-in-zone distribution bar (for workout cards / details).
function ZoneDist({ dist, height = 8, radius = 999 }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        height,
        borderRadius: radius,
        overflow: "hidden",
      }}
    >
      {dist.map((v, i) =>
        v > 0 ? (
          <div key={i} style={{ flex: v, background: ZONE_COLORS[i] }} />
        ) : null
      )}
    </div>
  );
}

// A stat with big number + unit + label, used in metric strips.
function Metric({ value, unit, label, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span
          style={{
            fontFamily: KT.font,
            fontSize: 26,
            fontWeight: 750,
            letterSpacing: "-.02em",
            color: accent ? KT.accentBri : KT.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontFamily: KT.font,
            fontSize: 13,
            fontWeight: 600,
            color: KT.muted,
          }}
        >
          {unit}
        </span>
      </div>
      <div
        style={{
          fontFamily: KT.font,
          fontSize: 12,
          color: KT.faint,
          marginTop: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Workout card used in Library and lists.
function WorkoutCard({ w, onClick }) {
  return (
    <Card onClick={onClick} pad={14} style={{ borderRadius: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: KT.bgAlt,
            border: `1px solid ${KT.hair}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon
            name={SPORT_ICON[w.sport]}
            size={21}
            color={KT.accentBri}
            sw={1.9}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: KT.font,
              fontSize: 15.5,
              fontWeight: 650,
              color: KT.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {w.title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 3,
              fontFamily: KT.font,
              fontSize: 12.5,
              color: KT.muted,
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Icon name="clock" size={13} sw={2} color={KT.faint} />
              {w.duration}
            </span>
            <span
              style={{
                width: 3,
                height: 3,
                borderRadius: 9,
                background: KT.faint,
              }}
            />
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <Icon name="flame" size={13} sw={2} color={KT.faint} />
              {w.tss} TSS
            </span>
          </div>
        </div>
        {w.tag && (
          <Pill style={{ padding: "4px 9px", fontSize: 11.5 }}>{w.tag}</Pill>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <ZoneDist dist={w.dist} />
      </div>
    </Card>
  );
}

Object.assign(window, { ZoneMap, ZoneDist, Metric, WorkoutCard });
