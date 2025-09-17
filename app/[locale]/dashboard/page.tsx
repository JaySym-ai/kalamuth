import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/firebase/request-auth";
import LogoutButton from "@/app/components/auth/LogoutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getRequestUser();
  if (!user) redirect(`/${locale}/auth`);

  const t = await getTranslations("Dashboard");
  return (
    <main className="relative min-h-screen bg-black text-white px-4 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),16px)] max-w-screen-sm mx-auto">
      <div className="absolute right-4 top-[max(env(safe-area-inset-top),16px)]">
        <LogoutButton />
      </div>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-base text-zinc-300">{t("comingSoon")}</p>
    </main>
  );
}

