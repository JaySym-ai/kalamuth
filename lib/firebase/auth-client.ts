"use client";

import { getClientAuth } from "@/lib/firebase/client";
import { isNative } from "@/lib/capacitor/platform";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signOut as webSignOut,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";

// Native auth bridge (Capacitor)
// Install: `npm i @capacitor-firebase/authentication`
// Types are provided by the plugin.
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

async function ensurePersistence() {
  const auth = getClientAuth();
  try {
    // IndexedDB persists well in WKWebView, but fall back to local for safety
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    await setPersistence(auth, inMemoryPersistence);
  }
}

export async function signInWithGoogle(): Promise<void> {
  await ensurePersistence();
  const auth = getClientAuth();

  if (isNative()) {
    // Native Google sign-in, then bridge to Firebase
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result?.credential?.idToken;
    if (!idToken) throw new Error("Google native sign-in failed: missing idToken");
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);

    // On native, skip session cookie exchange (different origin). Use client SDK directly.
    // If you need to call your Next.js backend, send Authorization: Bearer <idToken>.
    return;
  }

  // Web: try popup first, fall back to redirect (Safari/iOS)
  const provider = new GoogleAuthProvider();
  try {
    const userCred = await signInWithPopup(auth, provider);
    const idToken = await userCred.user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    // Popup may be blocked; use redirect
    await signInWithRedirect(auth, provider);
  }
}

export async function signOut(): Promise<void> {
  const auth = getClientAuth();
  if (isNative()) {
    // Sign out native session (optional but recommended)
    try { await FirebaseAuthentication.signOut(); } catch {}
    await webSignOut(auth);
    return;
  }
  await webSignOut(auth);
  // Also clear session cookie on web
  try { await fetch("/api/auth/session", { method: "DELETE" }); } catch {}
}

