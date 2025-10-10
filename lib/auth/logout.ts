"use client";

import { createClient } from "@/utils/supabase/clients";
import { debug_error } from "@/utils/debug";

export async function logout(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  } catch (error) {
    debug_error("Logout failed:", error);
    window.location.href = "/";
  }
}
