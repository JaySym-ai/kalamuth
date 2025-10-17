"use client";

import LanguageSwitcher from "../ui/LanguageSwitcher";
import LogoutButton from "../auth/LogoutButton";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/en" || pathname === "/fr" || pathname === "/en/" || pathname === "/fr/";

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-6">
        <LanguageSwitcher />
        {!isHome && <LogoutButton />}
      </nav>
    </>
  );
}
