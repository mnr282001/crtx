import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #0d0d14 0%, #1a1033 100%)",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* subtle glow */}
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.25)",
            filter: "blur(6px)",
          }}
        />
        <span
          style={{
            color: "#c4b5fd",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          CX
        </span>
      </div>
    ),
    { ...size }
  );
}
