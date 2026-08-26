import type { Metadata, Viewport } from "next";
import { PostHogPageview } from "@/components/PostHogPageview";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.flowstate.market";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Example App", template: "%s | Example App" },
  description: "Replace with a real product description.",
  applicationName: "Example App",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Example App",
    title: "Example App",
    description: "Replace with a real social preview description.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Example App" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Example App",
    description: "Replace with a real social preview description.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/app-icon-512.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Example App", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><PostHogPageview />{children}</body>
    </html>
  );
}
