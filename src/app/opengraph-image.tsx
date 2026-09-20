import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg, #075985, #0f766e)", color: "#fff", padding: "64px", fontFamily: "sans-serif" }}><div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#cffafe" }}>Playas in Playa</div><div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 940 }}><div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.04 }}>Find your people and your week in Playa.</div><div style={{ fontSize: 32, lineHeight: 1.35, color: "#e0f2fe" }}>Practical Playa del Carmen groups, events, deals, and local tips.</div></div><div style={{ fontSize: 24, color: "#cffafe" }}>playasinplaya.com</div></div>, size);
}
