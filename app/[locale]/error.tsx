'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/60 backdrop-blur-sm border border-amber-900/30 rounded-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-900/20 border border-red-600/50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-amber-400 mb-2">
            {locale === 'fr' ? 'Une erreur s\'est produite' : 'An error occurred'}
          </h2>
          <p className="text-gray-400 mb-6">
            {locale === 'fr' 
              ? 'Veuillez réessayer.' 
              : 'Please try again.'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold rounded-lg hover:from-amber-500 hover:to-red-500 transform hover:scale-105 transition-all duration-200"
          >
            {locale === 'fr' ? 'Réessayer' : 'Try Again'}
          </button>
          
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            {locale === 'fr' ? 'Retour au Tableau de Bord' : 'Back to Dashboard'}
          </button>
        </div>

        {process.env.NODE_ENV !== 'production' && error.message && (
          <div className="mt-6 p-4 bg-red-900/10 border border-red-600/30 rounded-lg text-left">
            <p className="text-xs text-red-300 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

