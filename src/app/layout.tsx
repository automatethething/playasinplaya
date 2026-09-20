import type { Metadata, Viewport } from "next";
import { PostHogPageview } from "@/components/PostHogPageview";
import "./globals.css";

const appUrl = "https://playasinplaya.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Playas in Playa", template: "%s | Playas in Playa" },
  description: "A practical Playa del Carmen guide for finding your people and your week.",
  applicationName: "Playas in Playa",
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Playas in Playa",
    title: "Playas in Playa | Find your people and your week in Playa",
    description: "Practical Playa del Carmen tips, curated groups, events, and weekly deals.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Playas in Playa" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Playas in Playa",
    description: "A practical Playa del Carmen guide for newcomers.",
    images: ["/twitter-image"],
  },
  icons: { icon: "/app-icon-512.png", shortcut: "/favicon.ico", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Playas in Playa", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#075985" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><PostHogPageview />{children}</body></html>;
}
