import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
            fontSize: 300,
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
