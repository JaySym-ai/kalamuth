import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { debug_error } from "@/utils/debug";
import LudusCreationClient from "./LudusCreationClient";
import LogoutButton from "../../components/auth/LogoutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export default async function LudusCreationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Must be authenticated
  if (!user) redirect(`/${locale}/auth`);

  // Check if user already has a ludus
  try {
    const { data: ludus } = await supabase
      .from("ludi")
      .select("id")
      .eq("userId", user.id)
      .limit(1)
      .maybeSingle();

    if (ludus) {
      // User already has a ludus: proceed into the app
      redirect(`/${locale}/dashboard`);
    }
  } catch (error) {
    const redirectError = error as { digest?: string };
    if (redirectError?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    debug_error("Error checking ludus:", error);
  }

  const t = await getTranslations("LudusCreation");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-amber-950/20 to-black" />
        <div className="absolute inset-0 bg-[url('/arena-bg.svg')] opacity-5" />

        {/* Animated glows */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/2 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="absolute top-4 right-4">
          <LogoutButton />
        </div>
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-full backdrop-blur-sm mb-4 sm:mb-6">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-amber-500"></span>
              </span>
              <span className="text-amber-400 text-xs sm:text-sm font-medium">
                {t("badge")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* Ludus Creation Form */}
          <LudusCreationClient />
        </div>
      </div>
    </div>
  );
}
