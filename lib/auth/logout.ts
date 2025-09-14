"use client";

import { getClientAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";

/**
 * Client-side logout function
 * Signs out from Firebase and clears server-side session cookies
 */
export async function logout(): Promise<void> {
  try {
    // Sign out from Firebase client
    const auth = getClientAuth();
    await signOut(auth);

    // Clear server-side session cookies
    await fetch("/api/auth/session", {
      method: "DELETE",
    });

    // Redirect to home page
    window.location.href = "/";
  } catch (error) {
    console.error("Logout failed:", error);
    // Even if logout fails, redirect to home
    window.location.href = "/";
  }
}
