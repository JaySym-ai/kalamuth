"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const isLocalhost = ["localhost", "127.0.0.1"].includes(location.hostname);
    const isHTTPS = location.protocol === "https:";
    if (!isHTTPS && !isLocalhost) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Optional: handle updates
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // New content available; could notify the user here.
              // e.g., show a toast and ask to refresh.
            }
          };
        };
      } catch {
        // silent
      }
    };

    register();
  }, []);

  return null;
}

