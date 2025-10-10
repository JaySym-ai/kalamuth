---
type: "always_apply"
---

Context

You are implementing or modifying features in a mobile-first web app that will be used primarily on phones. The stack is React/Next.js with TypeScript. Internationalization uses domain-based namespaces and useTranslations('Namespace').

Goals
	1.	Ship UI/UX that follows Android & iOS mobile best practices.
	2.	Never hardcode user-visible text; all strings must use i18n with EN + FR.
	3.	Add/adjust Playwright E2E tests for every change and keep the full suite green.

⸻

Hard Requirements

A) Mobile UI (Android & iOS friendly)
	•	Treat mobile as first class: design to smallest viewport first, then scale up.
	•	Respect safe areas and OS gestures: use CSS env(safe-area-inset-*) padding on top/bottom containers.
	•	Minimum tap target: 48×48dp (approx 44–48px).
	•	Text sizing: base 16px; avoid tiny text; ensure line-height ≥ 1.4.
	•	Avoid hover-only affordances; ensure visible focus/active states.
	•	Bottom navigation/actions leave 16–24px breathing room from screen edges.
	•	Forms: use mobile-friendly inputs (tel/email/number), numeric keypad where relevant, and proper autocomplete.
	•	Performance: lazy-load heavy components, optimize images, debounced handlers, no layout shift.

B) i18n (EN + FR, domain namespaces)
	•	Never hardcode UI strings. Use useTranslations('Namespace').
	•	Namespaces per locale:
common.json, nav.json, hero.json, features.json, gladiators.json, battle.json, cta.json, footer.json
	•	File layout example:

/locales/en/{common.json,nav.json,hero.json,features.json,gladiators.json,battle.json,cta.json,footer.json}
/locales/fr/{common.json,nav.json,hero.json,features.json,gladiators.json,battle.json,cta.json,footer.json}


	•	When touching a feature, migrate or add only the needed keys into the relevant namespace(s). Keep keys semantic, not UI-positional.
	•	Provide both EN & FR entries. If unsure of perfect phrasing, add a clear TODO comment and a sensible placeholder (no English leaks in FR UI).
	•	Keep existing useTranslations("Namespace") calls. Prefer reusing namespaces over adding new ones.

C) Playwright E2E (add/maintain)
	•	For each PR:
	•	Add/extend Playwright specs that cover the new/changed behavior.
	•	Update selectors to use stable hooks: data-testid (avoid brittle text selectors).
	•	Ensure suite passes locally (npx playwright test) and is CI-ready (headless).
	•	Include at least:
	•	happy path test,
	•	one edge/validation case,
	•	basic i18n toggle/locale render check (EN/FR for the changed surface).
	•	If refactoring breaks flows, update existing tests accordingly—no skipped tests left behind.

⸻

Deliverables
	•	Code changes implementing the feature with mobile-first patterns.
	•	Updated i18n JSON (EN + FR) in the correct namespace(s).
	•	Playwright tests covering the change; all tests pass.
	•	Short PR description including:
	•	Summary of change,
	•	Affected namespaces/keys,
	•	Test coverage notes (files & scenarios),
	•	Any TODOs for future i18n copy polish.

⸻

Definition of Done (checklist)
	•	No hardcoded user-visible strings (verified via code search).
	•	UI verified on iPhone & Android viewports (e.g., 360×800 and 390×844).
	•	Tap targets ≥ 48px; safe-area respected; no overlap with system gestures.
	•	EN & FR strings exist and render; fallbacks avoided.
	•	Playwright: new/updated specs for this change; suite is green.
	•	Accessibility basics: labels for inputs, focus states visible, color contrast ~WCAG AA.

⸻

Reference Snippets

Component (using i18n + mobile patterns)

import { useTranslations } from 'next-intl';

export function BattleCTA() {
  const t = useTranslations('cta');

  return (
    <section
      className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 max-w-screen-sm mx-auto"
      role="region"
      aria-labelledby="battle-cta-title"
    >
      <h2 id="battle-cta-title" className="text-xl font-semibold">
        {t('title')}
      </h2>

      <p className="mt-2 text-base">{t('subtitle')}</p>

      <button
        className="mt-4 w-full h-12 rounded-lg text-base font-medium"
        data-testid="cta-start-battle"
        aria-label={t('start_aria')}
      >
        {t('start')}
      </button>
    </section>
  );
}

/locales/en/cta.json

{
  "title": "Ready to battle?",
  "subtitle": "Assemble your gladiators and enter the arena.",
  "start": "Start Battle",
  "start_aria": "Start a new battle"
}

/locales/fr/cta.json

{
  "title": "Prêt pour le combat ?",
  "subtitle": "Assemble tes gladiateurs et entre dans l’arène.",
  "start": "Lancer le combat",
  "start_aria": "Démarrer un nouveau combat"
}

Playwright test (stable selectors + i18n spot check)

import { test, expect } from '@playwright/test';

test.describe('Battle CTA', () => {
  test('renders and starts battle (EN)', async ({ page }) => {
    await page.goto('/en/arena');
    await expect(page.getByTestId('cta-start-battle')).toBeVisible();
    await page.getByTestId('cta-start-battle').click();
    await expect(page).toHaveURL(/\/en\/battle\/setup/);
  });

  test('renders in FR locale', async ({ page }) => {
    await page.goto('/fr/arena');
    await expect(page.getByRole('heading', { name: 'Prêt pour le combat ?' })).toBeVisible();
  });
});


⸻

Guardrails / Do & Don’t
	•	Do use data-testid for any element interacted with in tests.
	•	Do keep namespace keys descriptive (battle.start.label) not positional (button3).
	•	Don’t introduce regressions to existing tests—update them alongside code.
	•	Don’t rely on pixel-perfect layouts; favor flexible mobile spacing and wrapping.

⸻
Task Output Format (what you return)
	1.	Summary of change (2–5 lines).
	2.	Files touched (paths).
	3.	New/updated i18n keys (EN + FR).
	4.	Playwright specs added/updated (paths) + scenarios list.
	5.	Any risks/TODOs.
⸻

For testing you can use one of theses accounts:
test2@hotmail.com / qplsk8hothot
test3@hotmail.com / qplsk8hothot
test4@hotmail.com / qplsk8hothot

They all have access to a test server, this test server should always be used for testing changes.

