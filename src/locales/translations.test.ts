/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  localizedSafetyGuides,
  SUPPORTED_LANGUAGES,
  translations,
  type Language,
  t,
} from './translations';

describe('translations and multilingual support', () => {
  it('supports all 8 required languages', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['en', 'ta', 'hi', 'te', 'kn', 'ml', 'bn', 'mr']);
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
  });

  it('provides translated dictionary keys for all 8 languages', () => {
    const languages: Language[] = ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'bn', 'mr'];
    for (const lang of languages) {
      expect(translations[lang]).toBeDefined();
      expect(translations[lang].appName).toBe('Waste2Worth');
      expect(translations[lang].dashboard).toBeDefined();
      expect(translations[lang].publishLot).toBeDefined();
      expect(translations[lang].acceptLot).toBeDefined();
    }
  });

  it('translates core user flow terms via t helper', () => {
    expect(t('login', 'en')).toBe('Sign In');
    expect(t('login', 'ta')).toBe('உள்நுழைக');
    expect(t('login', 'hi')).toBe('साइन इन');
    expect(t('login', 'te')).toBe('లాగిన్');
    expect(t('login', 'kn')).toBe('ಸೈನ್ ಇನ್');
    expect(t('login', 'ml')).toBe('സൈൻ ഇൻ');
    expect(t('login', 'bn')).toBe('সাইন ইন');
    expect(t('login', 'mr')).toBe('साइन इन');
  });

  it('localizes safety guides across languages', () => {
    const tamil = localizedSafetyGuides('ta');
    expect(tamil[0].title).toBe('பேட்டரி கையாளுதல்');
    expect(tamil[0].instructions[0]).not.toBe(localizedSafetyGuides('en')[0].instructions[0]);

    const telugu = localizedSafetyGuides('te');
    expect(telugu[0].title).toBe('బ్యాటరీ నిర్వహణ');

    expect(localizedSafetyGuides('en')).toHaveLength(7);
  });
});