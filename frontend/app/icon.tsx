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
          background: "#0d1624",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 28 28"
          style={{ display: "block" }}
        >
          <line x1="14" y1="11" x2="14" y2="2" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="6" y2="7" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="4" y2="14" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="8" y2="21" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="14" y2="26" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="21" y2="21" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="25" y2="14" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="11" x2="21" y2="5" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="14" y1="2" x2="6" y2="7" stroke="#38bdf8" strokeWidth="0.6" />
          <line x1="21" y1="5" x2="25" y2="14" stroke="#38bdf8" strokeWidth="0.6" />
          <circle cx="14" cy="11" r="2.2" fill="#38bdf8" />
          <circle cx="14" cy="2" r="1.6" fill="#38bdf8" />
          <circle cx="6" cy="7" r="1.6" fill="#38bdf8" />
          <circle cx="4" cy="14" r="1.6" fill="#38bdf8" />
          <circle cx="8" cy="21" r="1.6" fill="#38bdf8" />
          <circle cx="14" cy="26" r="1.6" fill="#38bdf8" />
          <circle cx="21" cy="21" r="1.6" fill="#38bdf8" />
          <circle cx="25" cy="14" r="1.6" fill="#38bdf8" />
          <circle cx="21" cy="5" r="1.6" fill="#38bdf8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
