import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse((<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(180deg, #111111 0%, #2a2a2a 100%)", color: "#fff", padding: "64px", fontFamily: "sans-serif" }}><div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#c7c7c7" }}>Example App</div><div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 940 }}><div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.04 }}>Main promise headline.</div><div style={{ fontSize: 34, lineHeight: 1.35, color: "#d4d4d4" }}>Auth, dashboard, and Supabase starter.</div></div><div style={{ fontSize: 24, color: "#a3a3a3" }}>example.flowstate.market</div></div>), size);
}
