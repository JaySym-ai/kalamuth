"use client";

import Link from "next/link";
import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const locales = [
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" }
  ];

  // Strip leading locale from current path (e.g., /en/xyz -> /xyz)
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)(?=\/|$)/, "");

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Language picker">
      {locales.map((l) => {
        const targetHref = `/${l.code}${pathWithoutLocale || ""}`;
        return (
          <Link
            key={l.code}
            href={targetHref}
            className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
              locale === l.code
                ? "bg-amber-600 text-white"
                : "bg-black/40 border border-amber-700/40 text-amber-300 hover:bg-amber-900/30"
            }`}
            aria-current={locale === l.code ? "true" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}

