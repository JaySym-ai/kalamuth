"use client";

import { createClient } from "@/utils/supabase/clients";

export async function logout(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  } catch (error) {
    console.error("Logout failed:", error);
    window.location.href = "/";
  }
}
