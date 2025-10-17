"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut, X } from "lucide-react";
import { logout } from "@/lib/auth/logout";
import { debug_error } from "@/utils/debug";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const t = useTranslations("Auth");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowConfirmDialog(false);
    try {
      await logout();
    } catch (error) {
      debug_error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutClick = () => {
    setShowConfirmDialog(true);
  };

  return (
    <>
      <button
        onClick={handleLogoutClick}
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

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("confirmLogout.title")}
              </h3>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              {t("confirmLogout.message")}
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isLoggingOut}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("confirmLogout.cancel")}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-lg hover:from-amber-500 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <div className="animate-spin w-4 h-4" />
                ) : null}
                {t("confirmLogout.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

