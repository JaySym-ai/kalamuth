import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import '../globals.css';
import RegisterSW from '../components/pwa/RegisterSW';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {locales} from '../../i18n';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Kalamuth - Forge Your Gladiator Empire',
  description:
    'Command your gladiators, train champions, and conquer the arena in this AI-powered gladiator management simulation. Every battle is uniquely simulated with detailed combat logs.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      {url: '/favicon.svg', type: 'image/svg+xml'},
      {url: '/icons/icon.svg', type: 'image/svg+xml'}
    ],
    shortcut: [{url: '/favicon.svg', type: 'image/svg+xml'}],
    apple: [{url: '/icons/maskable.svg', type: 'image/svg+xml'}]
  }
};


export const viewport = {
  themeColor: '#000000'
};

export function generateStaticParams() {
  return Array.from(locales).map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          {/* PWA service worker registration */}
          <div suppressHydrationWarning>
            <RegisterSW />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

