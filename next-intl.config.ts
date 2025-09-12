import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './i18n';

export default getRequestConfig(async ({locale}) => {
  // Fallback to default locale if unsupported
  const activeLocale: string = locale && (Array.from(locales) as string[]).includes(locale) ? locale : defaultLocale;

  const [common, nav, hero, features, gladiators, battle, cta, footer] = await Promise.all([
    import(`./messages/${activeLocale}/common.json`),
    import(`./messages/${activeLocale}/nav.json`),
    import(`./messages/${activeLocale}/hero.json`),
    import(`./messages/${activeLocale}/features.json`),
    import(`./messages/${activeLocale}/gladiators.json`),
    import(`./messages/${activeLocale}/battle.json`),
    import(`./messages/${activeLocale}/cta.json`),
    import(`./messages/${activeLocale}/footer.json`)
  ]);

  const messages = Object.assign(
    {},
    common.default,
    nav.default,
    hero.default,
    features.default,
    gladiators.default,
    battle.default,
    cta.default,
    footer.default
  );

  return {
    locales: Array.from(locales),
    defaultLocale,
    locale: activeLocale,
    messages
  };
});

