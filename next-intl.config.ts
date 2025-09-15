import {getRequestConfig} from 'next-intl/server';
import {routing} from './i18n/routing';

function deepifyMessages(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  function setPath(target: Record<string, unknown>, parts: string[], value: unknown) {
    let cur: Record<string, unknown> = target;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (i === parts.length - 1) {
        cur[p] = value as never;
      } else {
        if (typeof cur[p] !== 'object' || cur[p] === null || Array.isArray(cur[p])) {
          cur[p] = {} as never;
        }
        cur = cur[p] as Record<string, unknown>;
      }
    }
  }
  for (const [key, value] of Object.entries(obj || {})) {
    if (key.includes('.')) {
      setPath(out, key.split('.'), value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepifyMessages(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export default getRequestConfig(async ({locale, requestLocale}) => {
  // Try to get locale from different sources
  let detectedLocale: string | undefined = locale;

  // If no locale, try to await requestLocale if it's a Promise
  if (!detectedLocale && requestLocale) {
    try {
      detectedLocale = await requestLocale;
    } catch {
      // Ignore errors
    }
  }

  // Fallback to default locale if unsupported
  const activeLocale: string = detectedLocale && routing.locales.includes(detectedLocale as 'en' | 'fr') ? detectedLocale : routing.defaultLocale;

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

  // Optional namespaces (tolerate missing files per-locale)
  let auth: {default: Record<string, unknown>};
  let intro: {default: Record<string, unknown>};
  let serverSelection: {default: Record<string, unknown>};
  let ludusCreation: {default: Record<string, unknown>};
  let initialGladiators: {default: Record<string, unknown>};
  let dashboard: {default: Record<string, unknown>};
  let cities: {default: Record<string, unknown>};

  try { auth = await import(`./messages/${activeLocale}/auth.json`); } catch { auth = { default: {} }; }
  try { intro = await import(`./messages/${activeLocale}/intro.json`); } catch { intro = { default: {} }; }
  try { serverSelection = await import(`./messages/${activeLocale}/server-selection.json`); } catch { serverSelection = { default: {} }; }
  try { ludusCreation = await import(`./messages/${activeLocale}/ludus-creation.json`); } catch { ludusCreation = { default: {} }; }
  try { initialGladiators = await import(`./messages/${activeLocale}/initial-gladiators.json`); } catch { initialGladiators = { default: {} }; }
  try { dashboard = await import(`./messages/${activeLocale}/dashboard.json`); } catch { dashboard = { default: {} }; }
  try { cities = await import(`./messages/${activeLocale}/cities.json`); } catch { cities = { default: {} }; }

  const sources = [
    common.default,
    nav.default,
    hero.default,
    features.default,
    gladiators.default,
    battle.default,
    cta.default,
    footer.default,
    auth.default,
    intro.default,
    serverSelection.default,
    ludusCreation.default,
    initialGladiators.default,
    dashboard.default,
    cities.default
  ].map((m) => deepifyMessages(m as Record<string, unknown>));

  const messages = Object.assign({}, ...sources);



  return {
    locales: routing.locales,
    defaultLocale: routing.defaultLocale,
    locale: activeLocale,
    messages
  };
});

