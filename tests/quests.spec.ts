import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Quests i18n - Translation Keys', () => {
  test('should have questOngoing key in English translations', () => {
    const enPath = path.join(__dirname, '../messages/en/quests.json');
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

    expect(enContent.Quests).toHaveProperty('questOngoing');
    expect(enContent.Quests.questOngoing).toBe('The gladiator is on their quest. Check back soon for results.');
  });

  test('should have questOngoing key in French translations', () => {
    const frPath = path.join(__dirname, '../messages/fr/quests.json');
    const frContent = JSON.parse(fs.readFileSync(frPath, 'utf-8'));

    expect(frContent.Quests).toHaveProperty('questOngoing');
    expect(frContent.Quests.questOngoing).toBe('Le gladiateur est en quête. Revenez bientôt pour les résultats.');
  });

  test('should have matching keys in English and French translations', () => {
    const enPath = path.join(__dirname, '../messages/en/quests.json');
    const frPath = path.join(__dirname, '../messages/fr/quests.json');

    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const frContent = JSON.parse(fs.readFileSync(frPath, 'utf-8'));

    const enKeys = Object.keys(enContent.Quests).sort();
    const frKeys = Object.keys(frContent.Quests).sort();

    expect(enKeys).toEqual(frKeys);
  });
});

