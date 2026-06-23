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
          background: "#7c3aed",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: 900,
            fontFamily: "sans-serif",
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size }
  );
}
