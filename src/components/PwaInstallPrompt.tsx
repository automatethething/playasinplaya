"use client";

import { shouldSuppressInstallPrompt } from "@/lib/pwaInstall.mjs";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallPromptProps = {
  appName: string;
  reason: string;
  storageKey?: string;
};

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

export function PwaInstallPrompt({
  appName,
  reason,
  storageKey = "pwa-install-dismissed-at",
}: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(storageKey));

    if (
      shouldSuppressInstallPrompt({
        isStandalone: isStandaloneMode(),
        dismissedAt: Number.isFinite(dismissedAt) ? dismissedAt : null,
      })
    ) return;

    if (isIosSafari()) {
      setShowIosHelp(true);
      setVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      localStorage.setItem(storageKey, String(Date.now()));
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    localStorage.setItem(storageKey, String(Date.now()));
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible || (!deferredPrompt && !showIosHelp)) return null;

  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 16, padding: 16, background: "#fff", marginBottom: 16, position: "relative" }}>
      <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" style={{ position: "absolute", top: 10, right: 10, border: 0, background: "transparent", cursor: "pointer", fontSize: 18 }}>×</button>
      <h2 style={{ margin: "0 28px 6px 0", fontSize: 18 }}>Add {appName} to your home screen</h2>
      <p style={{ margin: "0 0 12px", color: "#555" }}>{reason}</p>
      {showIosHelp && !deferredPrompt ? (
        <p style={{ margin: 0, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>On iPhone: tap Share, then Add to Home Screen.</p>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={install} style={{ padding: "10px 14px", borderRadius: 10, border: 0, background: "#111", color: "#fff", cursor: "pointer" }}>Add app</button>
          <button type="button" onClick={dismiss} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Not now</button>
        </div>
      )}
    </section>
  );
}
