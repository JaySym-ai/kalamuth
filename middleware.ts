import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales: Array.from(locales),
  defaultLocale
});

export const config = {
  // Match only internationalized pathnames and the index route
  matcher: ['/', '/(en|fr)/:path*']
};

