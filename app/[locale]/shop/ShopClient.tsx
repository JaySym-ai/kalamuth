"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import PageLayout from "@/components/layout/PageLayout";
import type { Ludus } from "@/types/ludus";
import { motion } from "framer-motion";

interface ShopTranslations {
  title: string;
  subtitle: string;
  backToDashboard: string;
  comingSoon: string;
  description: string;
}

interface Props {
  ludus: Ludus & { id: string };
  locale: string;
  translations: ShopTranslations;
}

export default function ShopClient({ ludus, translations: t }: Props) {
  const currentLocale = useLocale();

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      backHref={`/${currentLocale}/dashboard`}
      icon="/assets/icon/shop.png"
      background="gradient"
    >
      {/* Coming Soon Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center py-12"
      >
        <div className="bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-xl p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Image
                src="/assets/icon/shop.png"
                alt="Shop"
                width={96}
                height={96}
                className="w-full h-full object-contain opacity-80"
              />
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold text-amber-400 mb-4">{t.comingSoon}</h2>
          <p className="text-gray-300 text-base leading-relaxed">{t.description}</p>

          {/* Ludus Treasury Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 pt-6 border-t border-amber-900/30"
          >
            <p className="text-sm text-gray-400 mb-2">Your Treasury</p>
            <p className="text-xl font-bold text-amber-300">
              {ludus.treasury.amount.toLocaleString()} {ludus.treasury.currency}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
}

