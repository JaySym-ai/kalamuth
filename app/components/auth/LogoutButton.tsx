"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
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
      className="p-3 bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      data-testid="logout-button"
      aria-label={t("logout")}
    >
      {isLoggingOut ? (
        <div className="animate-spin w-5 h-5" />
      ) : (
        <LogOut className="w-5 h-5" />
      )}
    </button>
  );
}

