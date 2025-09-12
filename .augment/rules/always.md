---
type: "always_apply"
---

Always make the UI mobile friendly because this will be played on mobile.
Should fit Android and Iphone best practice.

Never hardcode text, always i18n in French and English.
domain‑based namespaces per locale (common.json, nav.json, hero.json, features.json, gladiators.json, battle.json, cta.json, footer.json). We can implement this gradually and keep the same useTranslations("Namespace") calls