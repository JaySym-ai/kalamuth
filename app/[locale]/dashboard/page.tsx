import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/firebase/request-auth";

export const runtime = "nodejs";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getRequestUser();
  if (!user) redirect(`/${locale}/auth`);

  const t = await getTranslations("Dashboard");
  return (
    <main className="min-h-screen bg-black text-white px-4 pt-6 pb-[max(env(safe-area-inset-bottom),16px)] max-w-screen-sm mx-auto">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-base text-zinc-300">{t("comingSoon")}</p>
    </main>
  );
}

