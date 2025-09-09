"use client";

import { useState } from "react";
import NavLink from "../ui/NavLink";

const navItems = [
  { label: "Arena", href: "#arena" },
  { label: "Gladiators", href: "#gladiators" },
  { label: "Training", href: "#training" },
  { label: "City", href: "#city" },
  { label: "Wars", href: "#wars" },
];

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-8">
        {navItems.map((item) => (
          <NavLink key={item.label} href={item.href}>
            {item.label}
          </NavLink>
        ))}
        <button className="px-6 py-2 bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-amber-500/25">
          Enter Arena
        </button>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden relative w-10 h-10 flex flex-col justify-center items-center gap-1.5 group"
        aria-label="Toggle menu"
      >
        <span
          className={`block w-8 h-0.5 bg-amber-500 transition-all duration-300 ${
            isMenuOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block w-8 h-0.5 bg-amber-500 transition-all duration-300 ${
            isMenuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block w-8 h-0.5 bg-amber-500 transition-all duration-300 ${
            isMenuOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden fixed inset-x-0 top-[72px] bg-black/95 backdrop-blur-xl border-b border-amber-900/20 transform transition-transform duration-300 ${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-amber-500/25">
            Enter Arena
          </button>
        </nav>
      </div>
    </>
  );
}
