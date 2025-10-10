import { test, expect } from '@playwright/test';
import { rollRarity, getRarityLabel, isHighQuality, isLowQuality } from '@/lib/gladiator/rarity';
import { GladiatorRarity } from '@/types/gladiator';
import type { RarityConfig } from '@/types/server';

test.describe('Rarity System', () => {
  test('rollRarity returns a valid rarity level', () => {
    const config: RarityConfig = {
      bad: 5,
      common: 30,
      uncommon: 35,
      rare: 20,
      epic: 8,
      legendary: 1.5,
      unique: 0.5,
    };

    // Roll multiple times to ensure we get valid results
    for (let i = 0; i < 100; i++) {
      const rarity = rollRarity(config);
      expect(Object.values(GladiatorRarity)).toContain(rarity);
    }
  });

  test('rollRarity respects probability distribution', () => {
    const config: RarityConfig = {
      bad: 50,
      common: 50,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      unique: 0,
    };

    const results: Record<string, number> = {};
    const rolls = 1000;

    for (let i = 0; i < rolls; i++) {
      const rarity = rollRarity(config);
      results[rarity] = (results[rarity] || 0) + 1;
    }

    // With 50/50 split, we should get roughly equal distribution
    // Allow 20% variance
    const badCount = results[GladiatorRarity.BAD] || 0;
    const commonCount = results[GladiatorRarity.COMMON] || 0;

    expect(badCount).toBeGreaterThan(rolls * 0.3);
    expect(badCount).toBeLessThan(rolls * 0.7);
    expect(commonCount).toBeGreaterThan(rolls * 0.3);
    expect(commonCount).toBeLessThan(rolls * 0.7);
  });

  test('getRarityLabel returns correct labels', () => {
    expect(getRarityLabel(GladiatorRarity.BAD)).toBe('Bad');
    expect(getRarityLabel(GladiatorRarity.COMMON)).toBe('Common');
    expect(getRarityLabel(GladiatorRarity.UNCOMMON)).toBe('Uncommon');
    expect(getRarityLabel(GladiatorRarity.RARE)).toBe('Rare');
    expect(getRarityLabel(GladiatorRarity.EPIC)).toBe('Epic');
    expect(getRarityLabel(GladiatorRarity.LEGENDARY)).toBe('Legendary');
    expect(getRarityLabel(GladiatorRarity.UNIQUE)).toBe('Unique');
  });

  test('isHighQuality correctly identifies high quality rarities', () => {
    expect(isHighQuality(GladiatorRarity.BAD)).toBe(false);
    expect(isHighQuality(GladiatorRarity.COMMON)).toBe(false);
    expect(isHighQuality(GladiatorRarity.UNCOMMON)).toBe(false);
    expect(isHighQuality(GladiatorRarity.RARE)).toBe(true);
    expect(isHighQuality(GladiatorRarity.EPIC)).toBe(true);
    expect(isHighQuality(GladiatorRarity.LEGENDARY)).toBe(true);
    expect(isHighQuality(GladiatorRarity.UNIQUE)).toBe(true);
  });

  test('isLowQuality correctly identifies low quality rarities', () => {
    expect(isLowQuality(GladiatorRarity.BAD)).toBe(true);
    expect(isLowQuality(GladiatorRarity.COMMON)).toBe(true);
    expect(isLowQuality(GladiatorRarity.UNCOMMON)).toBe(false);
    expect(isLowQuality(GladiatorRarity.RARE)).toBe(false);
    expect(isLowQuality(GladiatorRarity.EPIC)).toBe(false);
    expect(isLowQuality(GladiatorRarity.LEGENDARY)).toBe(false);
    expect(isLowQuality(GladiatorRarity.UNIQUE)).toBe(false);
  });

  test('legendary and unique are very rare', () => {
    const config: RarityConfig = {
      bad: 5,
      common: 30,
      uncommon: 35,
      rare: 20,
      epic: 8,
      legendary: 1.5,
      unique: 0.5,
    };

    const results: Record<string, number> = {};
    const rolls = 10000;

    for (let i = 0; i < rolls; i++) {
      const rarity = rollRarity(config);
      results[rarity] = (results[rarity] || 0) + 1;
    }

    const legendaryCount = results[GladiatorRarity.LEGENDARY] || 0;
    const uniqueCount = results[GladiatorRarity.UNIQUE] || 0;

    // Legendary should be ~1.5% (150 out of 10000)
    expect(legendaryCount).toBeGreaterThan(50);
    expect(legendaryCount).toBeLessThan(250);

    // Unique should be ~0.5% (50 out of 10000)
    expect(uniqueCount).toBeGreaterThan(10);
    expect(uniqueCount).toBeLessThan(150);
  });
});

