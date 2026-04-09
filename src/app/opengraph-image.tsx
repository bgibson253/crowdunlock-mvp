import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Unmaskr: Crowdfunded Content Unlocking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f0d2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
          }}
        >
          Unmaskr
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a5b4fc",
            marginTop: 16,
          }}
        >
          You decide what gets uncovered.
        </div>
        <div
          style={{
            fontSize: 18,
            color: "#818cf8",
            marginTop: 40,
            padding: "10px 24px",
            border: "1px solid #6366f1",
            borderRadius: 8,
          }}
        >
          unmaskr.org
        </div>
      </div>
    ),
    { ...size }
  );
}
