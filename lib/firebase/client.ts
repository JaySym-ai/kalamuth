// Client-side Firebase (modular v9+). Safe for Next.js App Router (2025 best practices).
// - Initializes only in the browser
// - Avoids SSR eval by never touching window-only APIs at import time
// - Analytics loaded only when supported

import type { FirebaseApp } from "firebase/app";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Public config from env (safe to expose in browser). Do not hardcode in source.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  // Optional
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} as const;

function ensureBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Firebase client SDK used on the server. Import from server-only modules instead.");
  }
}

function getClientApp(): FirebaseApp {
  ensureBrowser();
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getClientApp());
}

export function getClientDb(): Firestore {
  return getFirestore(getClientApp());
}

// Analytics must only be called in browsers that support it (no SSR, no Node, no React Native)
let analyticsPromise: Promise<Analytics | null> | null = null;
export function getClientAnalytics(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = (async () => {
    try {
      ensureBrowser();
      if (!(await isSupported())) return null;
      const app = getClientApp();
      return getAnalytics(app);
    } catch {
      return null;
    }
  })();
  return analyticsPromise;
}

