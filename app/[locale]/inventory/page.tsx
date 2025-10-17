import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCurrentUserLudusTransformed } from "@/lib/ludus/repository";
import { requireAuthPage } from "@/lib/auth/server";
import InventoryClient from "./InventoryClient";
import type { Ludus } from "@/types/ludus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { user } = await requireAuthPage(locale);

  // Fetch user's ludus
  let ludusData: (Ludus & { id: string }) | null = null;

  try {
    ludusData = await getCurrentUserLudusTransformed(user.id);
    
    if (!ludusData) {
      redirect(`/${locale}/server-selection`);
    }
  } catch (error) {
    console.error("Error fetching ludus:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations({ locale, namespace: "Inventory" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      <InventoryClient
        ludus={ludusData!}
        locale={locale}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          backToDashboard: t("backToDashboard"),
          noItems: t("noItems"),
          description: t("description"),
        }}
      />
    </main>
  );
}

