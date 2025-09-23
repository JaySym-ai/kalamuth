"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CITIES } from "@/data/cities";

export default function LudusCreationClient() {
  const t = useTranslations("LudusCreation");
  const tCities = useTranslations("Cities");
  const locale = useLocale();
  const router = useRouter();
  
  const [ludusName, setLudusName] = useState("");
  const [selectedCity, setSelectedCity] = useState(CITIES[0]?.id || "");
  const [motto, setMotto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    // Get selected server from session storage
    const serverId = sessionStorage.getItem("selectedServerId");
    if (!serverId) {
      // No server selected, redirect back to server selection
      router.push(`/${locale}/server-selection`);
    } else {
      setSelectedServerId(serverId);
    }
  }, [locale, router]);

  const handleCreateLudus = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating ludus with:", {
      ludusName,
      selectedServerId,
      selectedCity,
      motto
    });

    if (!ludusName.trim()) {
      setError(t("errors.nameRequired"));
      return;
    }

    if (!selectedServerId) {
      console.error("No server selected!");
      setError(t("errors.noServer"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the ludus (logo will be added later)
      const response = await fetch("/api/ludus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ludusName.trim(),
          logoUrl: "🏛️", // Default temple logo for now
          serverId: selectedServerId,
          locationCity: selectedCity,
          motto: motto.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Error:", errorData);
        throw new Error(errorData?.error || errorData?.details || "Failed to create ludus");
      }

      const data = await response.json();

      // Store ludus ID for the next step
      sessionStorage.setItem("ludusId", data.ludusId);

      // Navigate immediately to gladiator display - generation will start there
      router.push(`/${locale}/initial-gladiators`);
    } catch (err) {
      console.error("Error creating ludus:", err);
      setError(t("errors.createFailed"));
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleCreateLudus}
      className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-8 space-y-6"
    >
      {/* Ludus Name */}
      <div>
        <label className="block text-sm font-medium text-amber-400 mb-2">
          {t("form.name.label")}
        </label>
        <input
          type="text"
          value={ludusName}
          onChange={(e) => setLudusName(e.target.value)}
          placeholder={t("form.name.placeholder")}
          className="w-full px-4 py-3 bg-black/50 border border-amber-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
          maxLength={50}
          required
          data-testid="ludus-name-input"
        />
        <p className="mt-1 text-xs text-gray-500">
          {t("form.name.hint")}
        </p>
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-amber-400 mb-2">
          {t("form.city.label")}
        </label>

        {/* City Grid - No scrollbar needed for 12 cities */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setSelectedCity(city.id)}
              className={`
                p-3 rounded-lg border transition-all duration-200 text-left
                ${selectedCity === city.id
                  ? "bg-amber-900/40 border-amber-500 shadow-lg shadow-amber-500/20"
                  : "bg-black/30 border-amber-900/30 hover:border-amber-700/50 hover:bg-amber-900/20"
                }
              `}
              data-testid={`city-${city.id}`}
            >
              <div className="text-sm font-medium text-amber-100">
                {tCities(`${city.id}.name`)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {city.inhabitants.toLocaleString()} pop.
              </div>
            </button>
          ))}
        </div>

        {/* Show selected city description */}
        {selectedCity && (
          <div className="mt-3 p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
            <div className="text-sm font-medium text-amber-300 mb-1">
              {tCities(`${selectedCity}.name`)}
            </div>
            <p className="text-xs text-amber-100/80">
              {tCities(`${selectedCity}.description`)}
            </p>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          {t("form.city.hint")}
        </p>
      </div>

      {/* Motto (Optional) */}
      <div>
        <label className="block text-sm font-medium text-amber-400 mb-2">
          {t("form.motto.label")}
        </label>
        <textarea
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
          placeholder={t("form.motto.placeholder")}
          className="w-full px-4 py-3 bg-black/50 border border-amber-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
          rows={3}
          maxLength={200}
          data-testid="motto-input"
        />
        <p className="mt-1 text-xs text-gray-500">
          {t("form.motto.hint")}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-sm text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !ludusName.trim()}
        className={`
          w-full py-4 rounded-lg font-bold text-lg text-white
          transform transition-all duration-300
          ${!loading && ludusName.trim()
            ? "bg-gradient-to-r from-amber-600 to-red-600 hover:scale-105 shadow-2xl shadow-amber-600/30"
            : "bg-gray-800 cursor-not-allowed opacity-50"
          }
        `}
        data-testid="create-ludus-button"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t("creating")}
          </span>
        ) : (
          t("createButton")
        )}
      </button>

      {/* Info Text */}
      <p className="text-center text-gray-500 text-sm">
        {t("infoText")}
      </p>
    </motion.form>
  );
}
