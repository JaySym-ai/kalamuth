"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/auth/logout";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations("Auth");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-4 py-2 text-sm text-zinc-200 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-colors disabled:opacity-50"
      data-testid="logout-button"
      aria-label={t("logout")}
    >
      {isLoggingOut ? t("loggingOut") : t("logout")}
    </button>
  );
}

