import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16281f",
        }}
      >
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: "#e4a33a",
            fontFamily: "sans-serif",
          }}
        >
          L
        </div>
      </div>
    ),
    { ...size }
  );
}
