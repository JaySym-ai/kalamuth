import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserLudusTransformed } from "@/lib/ludus/repository";
import { getTavernGladiatorsByLudus } from "@/lib/gladiator/repository";
import { requireAuthPage } from "@/lib/auth/server";
import { debug_error } from "@/utils/debug";
import TavernClient from "./TavernClient";
import type { Ludus } from "@/types/ludus";
import type { NormalizedGladiator } from "@/lib/gladiator/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TavernPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await requireAuthPage(locale);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;
  let tavernGladiators: NormalizedGladiator[] = [];

  try {
    ludusData = await getCurrentUserLudusTransformed(user.id);

    if (!ludusData) {
      debug_error("No ludus found for user, redirecting to server selection");
      redirect(`/${locale}/server-selection`);
    }

    // Fetch tavern gladiators for this ludus
    tavernGladiators = await getTavernGladiatorsByLudus(ludusData.id, locale);

    // Log if no gladiators found (this is normal, but good to track)
    if (tavernGladiators.length === 0) {
      debug_error("No tavern gladiators found for ludus:", ludusData.id);
    }
  } catch (error) {
    // Check if this is a Next.js redirect error (which is expected)
    const redirectError = error as { digest?: string };
    if (redirectError?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error; // Re-throw redirect errors
    }

    debug_error("Error loading tavern data:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("Tavern");

  // This should never happen due to the redirect above, but TypeScript safety
  if (!ludusData) {
    redirect(`/${locale}/server-selection`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <TavernClient
        ludus={ludusData}
        tavernGladiators={tavernGladiators}
        locale={locale}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          welcomeMessage: t("welcomeMessage"),
          currentGladiator: t("currentGladiator"),
          sendMessage: t("sendMessage"),
          messagePlaceholder: t("messagePlaceholder"),
          skip: t("skip"),
          next: t("next"),
          loadingResponse: t("loadingResponse"),
          recruitThisGladiator: t("recruitThisGladiator"),
          chatHistory: t("chatHistory"),
          birthCity: t("birthCity"),
          name: t("name"),
          ludusFullTitle: t("ludusFullTitle"),
          ludusFullMessage: t("ludusFullMessage"),
          loadingGladiators: t("loadingGladiators"),
          error: t("error"),
          backToDashboard: t("backToDashboard"),
          recruit: t("recruit"),
          recruiting: t("recruiting"),
          confirmSkipTitle: t("confirmSkipTitle"),
          confirmSkipMessage: t("confirmSkipMessage"),
          confirmSkipYes: t("confirmSkipYes"),
          confirmSkipNo: t("confirmSkipNo"),
          confirmRecruitTitle: t("confirmRecruitTitle"),
          confirmRecruitMessage: t("confirmRecruitMessage"),
          confirmRecruitYes: t("confirmRecruitYes"),
          confirmRecruitNo: t("confirmRecruitNo"),
        }}
      />
    </main>
  );
}

