import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CRTX — Document Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#09090b",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ambient amber glow — top right */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 68%)",
          }}
        />

        {/* Ambient amber glow — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 68%)",
          }}
        />

        {/* Left amber accent bar */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 88,
            width: 4,
            height: 108,
            background: "#f59e0b",
          }}
        />

        {/* Decorative stacked lines — top right corner */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: 88,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "flex-end",
          }}
        >
          {[220, 160, 100, 56, 32].map((w, i) => (
            <div
              key={i}
              style={{ width: w, height: 1, background: "#27272a" }}
            />
          ))}
        </div>

        {/* Bottom border line */}
        <div
          style={{
            position: "absolute",
            bottom: 72,
            left: 80,
            right: 80,
            height: 1,
            background: "#18181b",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 120,
            paddingRight: 80,
            paddingTop: 88,
            paddingBottom: 88,
            flex: 1,
          }}
        >
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 30,
            }}
          >
            <div
              style={{ width: 7, height: 7, background: "#f59e0b" }}
            />
            <span
              style={{
                fontSize: 13,
                color: "#52525b",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              DOCUMENT INTELLIGENCE
            </span>
          </div>

          {/* CRTX wordmark */}
          <div
            style={{
              fontSize: 176,
              fontWeight: 900,
              color: "#fafafa",
              lineHeight: 0.88,
              letterSpacing: "-0.03em",
              marginBottom: 10,
            }}
          >
            CRTX
          </div>

          {/* Amber underline */}
          <div
            style={{
              width: 128,
              height: 3,
              background: "#f59e0b",
              marginBottom: 36,
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 26,
              color: "#a1a1aa",
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: 560,
              marginBottom: 48,
            }}
          >
            Ask anything. Get cited answers from your documents — instantly.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              "PDF & URL ingestion",
              "Semantic search",
              "Cited sources",
              "Team workspaces",
            ].map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 11,
                  color: "#3f3f46",
                  border: "1px solid #27272a",
                  padding: "6px 14px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Domain — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 80,
            fontSize: 14,
            color: "#3f3f46",
            fontFamily: "monospace",
            letterSpacing: "0.14em",
          }}
        >
          crtx.chat
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
