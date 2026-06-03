// heroes.jsx — three landing hero directions. Depends on kl.jsx.

// Shared nav bar
function Nav({ w = 1280 }) {
  const links = ["Features", "Docs", "Developers", "Open Source"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: `1px solid ${KL.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Logo size={28} />
        <span
          style={{
            fontFamily: KL.font,
            fontSize: 19,
            fontWeight: 800,
            color: KL.text,
            letterSpacing: "-.01em",
          }}
        >
          kaiord
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {links.map((l) => (
          <span
            key={l}
            style={{
              fontFamily: KL.font,
              fontSize: 14.5,
              color: KL.textSec,
              fontWeight: 500,
            }}
          >
            {l}
          </span>
        ))}
        <LBtn size="md">Try the Editor</LBtn>
      </div>
    </div>
  );
}

// ── Variant A — Product-first split ─────────────────────────────────
function HeroA() {
  return (
    <div
      style={{
        width: 1280,
        minHeight: 720,
        background: KL.bg,
        fontFamily: KL.font,
      }}
    >
      <Nav />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 40,
          alignItems: "center",
          padding: "64px 48px 70px",
        }}
      >
        <div>
          <div style={{ marginBottom: 22 }}>
            <Badge icon="sparkle" color={KL.blueBright}>
              Plan · Generate · Sync
            </Badge>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 60,
              lineHeight: 1.04,
              fontWeight: 800,
              letterSpacing: "-.03em",
              color: KL.text,
            }}
          >
            Train with
            <br />
            structure, not
            <br />
            <span style={{ color: KL.blueBright }}>spreadsheets.</span>
          </h1>
          <p
            style={{
              margin: "24px 0 0",
              fontSize: 19,
              lineHeight: 1.55,
              color: KL.textSec,
              maxWidth: 460,
            }}
          >
            Build structured workouts, generate them with AI from a
            plain-language prompt, and push them straight to your Garmin — all
            from your browser.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 34 }}>
            <LBtn size="lg" iconR="arrowR">
              Try the Editor
            </LBtn>
            <LBtn size="lg" variant="ghost" icon="terminal">
              For developers
            </LBtn>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
            <Badge icon="check" color={KL.tip}>
              No account needed
            </Badge>
            <Badge icon="check" color={KL.tip}>
              Runs in-browser
            </Badge>
            <Badge icon="check" color={KL.tip}>
              MIT licensed
            </Badge>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <EditorPhone />
        </div>
      </div>
    </div>
  );
}

// ── Variant B — Audience fork ───────────────────────────────────────
function ForkCard({ tone, eyebrow, title, desc, children, cta, ctaVariant }) {
  return (
    <div
      style={{
        flex: 1,
        background: KL.surface,
        border: `1px solid ${tone}55`,
        borderRadius: 22,
        padding: 30,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 999,
          background: `radial-gradient(closest-side, ${tone}22, transparent)`,
        }}
      />
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          alignItems: "center",
          gap: 7,
          padding: "6px 13px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          background: `${tone}1f`,
          color: tone,
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: ".04em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          margin: "18px 0 8px",
          fontSize: 27,
          fontWeight: 750,
          color: KL.text,
          letterSpacing: "-.02em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 15.5,
          lineHeight: 1.55,
          color: KL.textSec,
        }}
      >
        {desc}
      </p>
      <div style={{ margin: "22px 0", flex: 1 }}>{children}</div>
      <LBtn
        variant={ctaVariant}
        iconR="arrowR"
        style={{ alignSelf: "flex-start" }}
      >
        {cta}
      </LBtn>
    </div>
  );
}

function HeroB() {
  return (
    <div
      style={{
        width: 1280,
        minHeight: 760,
        background: KL.bg,
        fontFamily: KL.font,
      }}
    >
      <Nav />
      <div style={{ padding: "60px 48px 30px", textAlign: "center" }}>
        <h1
          style={{
            margin: "0 auto",
            maxWidth: 760,
            fontSize: 54,
            lineHeight: 1.06,
            fontWeight: 800,
            letterSpacing: "-.03em",
            color: KL.text,
          }}
        >
          One framework.
          <br />
          <span style={{ color: KL.blueBright }}>Every fitness format.</span>
        </h1>
        <p
          style={{
            margin: "20px auto 0",
            maxWidth: 580,
            fontSize: 18,
            lineHeight: 1.55,
            color: KL.textSec,
          }}
        >
          Whether you train or you build — Kaiord meets you where you are.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
          padding: "20px 48px 70px",
          alignItems: "stretch",
        }}
      >
        <ForkCard
          tone={KL.blueBright}
          eyebrow="For athletes"
          title="Use the editor"
          desc="Create, AI-generate, and sync structured workouts to Garmin. No code, no account."
          cta="Open the Editor"
          ctaVariant="primary"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              transform: "scale(.9)",
              transformOrigin: "top center",
              height: 300,
              overflow: "hidden",
            }}
          >
            <div
              style={{ transform: "scale(.62)", transformOrigin: "top center" }}
            >
              <EditorPhone glow={false} />
            </div>
          </div>
        </ForkCard>
        <ForkCard
          tone={KL.purple}
          eyebrow="For developers"
          title="Build with the SDK"
          desc="Convert between FIT, TCX, ZWO & Garmin in 4 lines of TypeScript. Strategy pattern, your adapters."
          cta="Read the Docs"
          ctaVariant="soft"
        >
          <CodeBlock />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
              padding: "11px 14px",
              borderRadius: 12,
              background: KL.bgDeep,
              border: `1px solid ${KL.border}`,
            }}
          >
            <span
              style={{ fontFamily: KL.mono, fontSize: 13.5, color: KL.textSec }}
            >
              npm i @kaiord/core
            </span>
            <span style={{ marginLeft: "auto" }}>
              <LIcon name="copy" size={15} color={KL.muted} />
            </span>
          </div>
        </ForkCard>
      </div>
    </div>
  );
}

function CodeBlock({ compact }) {
  const C = KL;
  return (
    <div
      style={{
        borderRadius: 13,
        border: `1px solid ${C.border}`,
        background: "#131c2e",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 13px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 9,
            background: "#ef444466",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 9,
            background: "#f59e0b66",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 9,
            background: "#22c55e66",
          }}
        />
        <span
          style={{
            marginLeft: 6,
            fontFamily: C.mono,
            fontSize: 11.5,
            color: C.muted,
          }}
        >
          convert.ts
        </span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 15,
          fontFamily: C.mono,
          fontSize: 13,
          lineHeight: 1.7,
          overflow: "hidden",
        }}
      >
        <code>
          <span style={{ color: C.purple }}>import</span>
          <span style={{ color: C.text }}> {"{ fromBinary, fitReader }"} </span>
          <span style={{ color: C.purple }}>from</span>{" "}
          <span style={{ color: C.tip }}>'@kaiord/fit'</span>
          {"\n"}
          <span style={{ color: C.purple }}>import</span>
          <span style={{ color: C.text }}> {"{ toText, tcxWriter }"} </span>
          <span style={{ color: C.purple }}>from</span>{" "}
          <span style={{ color: C.tip }}>'@kaiord/tcx'</span>
          {"\n\n"}
          <span style={{ color: C.purple }}>const</span>{" "}
          <span style={{ color: C.blueBright }}>krd</span>{" "}
          <span style={{ color: C.muted }}>=</span>{" "}
          <span style={{ color: C.purple }}>await</span>{" "}
          <span style={{ color: "#fbbf24" }}>fromBinary</span>
          <span style={{ color: C.muted }}>(file, fitReader)</span>
          {"\n"}
          <span style={{ color: C.purple }}>const</span>{" "}
          <span style={{ color: C.blueBright }}>tcx</span>{" "}
          <span style={{ color: C.muted }}>=</span>{" "}
          <span style={{ color: C.purple }}>await</span>{" "}
          <span style={{ color: "#fbbf24" }}>toText</span>
          <span style={{ color: C.muted }}>(krd, tcxWriter)</span>
        </code>
      </pre>
    </div>
  );
}

// ── Variant C — Show-dominant / bold ────────────────────────────────
function HeroC() {
  return (
    <div
      style={{
        width: 1280,
        minHeight: 760,
        background: `radial-gradient(900px 500px at 70% 0%, #16233b, ${KL.bgDeep} 65%)`,
        fontFamily: KL.font,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Nav />
      <div style={{ position: "relative", padding: "64px 48px 0" }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ marginBottom: 20 }}>
            <Badge dot color={KL.tip}>
              Live · Garmin sync in one tap
            </Badge>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 66,
              lineHeight: 1.0,
              fontWeight: 850,
              letterSpacing: "-.035em",
              color: KL.text,
            }}
          >
            Your training,
            <br />
            finally in
            <br />
            <span
              style={{
                background: `linear-gradient(100deg, ${KL.blueBright}, ${KL.purple})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              one place.
            </span>
          </h1>
          <p
            style={{
              margin: "26px 0 0",
              fontSize: 19,
              lineHeight: 1.55,
              color: KL.textSec,
              maxWidth: 440,
            }}
          >
            Describe a session in plain words. Kaiord builds it around your
            zones and sends it to your watch.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
            <LBtn size="lg" iconR="arrowR">
              Start training
            </LBtn>
            <LBtn size="lg" variant="ghost">
              See how it works
            </LBtn>
          </div>
        </div>

        {/* floating product cluster */}
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            width: 470,
            height: 580,
          }}
        >
          <div style={{ position: "absolute", right: 0, top: 10 }}>
            <EditorPhone />
          </div>
          {/* AI generate floating card */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 84,
              width: 244,
              padding: 16,
              borderRadius: 18,
              background: "rgba(30,41,59,.94)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${KL.border}`,
              boxShadow: "0 24px 50px rgba(0,0,0,.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <LIcon name="sparkle" size={17} color={KL.blueBright} />
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: KL.text,
                  whiteSpace: "nowrap",
                }}
              >
                Generate with AI
              </span>
            </div>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: KL.bgDeep,
                border: `1px solid ${KL.border}`,
                fontSize: 13,
                color: KL.textSec,
                lineHeight: 1.4,
              }}
            >
              "4×4 VO₂ max with a long warm-up"
            </div>
            <div
              style={{
                display: "flex",
                gap: 2,
                height: 7,
                borderRadius: 999,
                overflow: "hidden",
                marginTop: 12,
              }}
            >
              {[0.16, 0.26, 0.04, 0.1, 0.44].map((w, i) => (
                <div key={i} style={{ flex: w, background: ZONES[i] }} />
              ))}
            </div>
          </div>
          {/* Garmin push toast */}
          <div
            style={{
              position: "absolute",
              left: 6,
              bottom: 16,
              width: 236,
              padding: "13px 15px",
              borderRadius: 16,
              background: "rgba(30,41,59,.96)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${KL.tip}44`,
              boxShadow: "0 20px 44px rgba(0,0,0,.5)",
              display: "flex",
              alignItems: "center",
              gap: 11,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                flexShrink: 0,
                background: "rgba(52,211,153,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LIcon name="check" size={17} color={KL.tip} sw={2.6} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: KL.text,
                  whiteSpace: "nowrap",
                }}
              >
                On your Garmin
              </div>
              <div style={{ fontSize: 11.5, color: KL.muted }}>
                Synced 8s ago
              </div>
            </div>
          </div>
        </div>

        {/* format strip footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 64,
            paddingBottom: 56,
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              color: KL.muted,
              fontWeight: 600,
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Works with
          </span>
          {[".FIT", ".TCX", ".ZWO", ".GCN"].map((f) => (
            <span
              key={f}
              style={{
                fontFamily: KL.mono,
                fontSize: 14,
                fontWeight: 600,
                color: KL.textSec,
                padding: "6px 13px",
                borderRadius: 9,
                border: `1px solid ${KL.border}`,
                background: KL.surface,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HeroA, HeroB, HeroC, Nav, CodeBlock, ForkCard });
