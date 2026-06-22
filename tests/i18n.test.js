import { describe, it, expect } from 'vitest';

/**
 * i18n.test.js — Translation dictionary and engine tests
 * v1.14.0: Comprehensive coverage for I18n module
 */

// Simulate minimal browser globals for Node environment
if (typeof window === 'undefined') {
  globalThis.window = {
    location: { search: '' },
    navigator: { language: 'en' },
  };
  globalThis.document = {
    documentElement: { lang: '' },
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => ({
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      querySelector: () => null,
      textContent: '',
    }),
  };
  globalThis.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = val; },
  };
}

// Load TRANSLATIONS from source
import fs from 'fs';
import path from 'path';
const i18nSource = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'js', 'i18n.js'),
  'utf-8'
);

// Extract TRANSLATIONS object from source
const match = i18nSource.match(/const TRANSLATIONS = (\{[\s\S]*?\n\});/);
if (!match) throw new Error('Could not extract TRANSLATIONS from i18n.js');

// Safely evaluate the TRANSLATIONS (it uses computed keys)
const translationsCode = match[1];
const TRANSLATIONS = new Function('return ' + translationsCode)();

describe('i18n Translation Dictionary', () => {
  it('has more than 50 translation keys', () => {
    const count = Object.keys(TRANSLATIONS).length;
    expect(count).toBeGreaterThan(50);
  });

  it('every key has at least zh and en translations', () => {
    const missingKeys = [];
    Object.entries(TRANSLATIONS).forEach(([key, entry]) => {
      if (!entry.zh) missingKeys.push(`${key}: missing zh`);
      if (!entry.en) missingKeys.push(`${key}: missing en`);
    });
    expect(missingKeys).toEqual([]);
  });

  it('every key has a ja translation (v1.13.0+)', () => {
    const missingKeys = [];
    Object.entries(TRANSLATIONS).forEach(([key, entry]) => {
      if (!entry.ja) missingKeys.push(`${key}: missing ja`);
    });
    expect(missingKeys).toEqual([]);
  });

  it('loader keys support {n} interpolation', () => {
    const drawing = TRANSLATIONS['loader.drawing'];
    expect(drawing.zh).toContain('{n}');
    expect(drawing.en).toContain('{n}');
    expect(drawing.ja).toContain('{n}');
  });

  it('card.count supports {n} interpolation', () => {
    const count = TRANSLATIONS['card.count'];
    expect(count.zh).toContain('{n}');
    expect(count.en).toContain('{n}');
    expect(count.ja).toContain('{n}');
  });

  it('has all stage names (7 stages)', () => {
    const stageKeys = ['arrival', 'fan', 'gather', 'wave', 'grid', 'spiral', 'depart'];
    for (const key of stageKeys) {
      expect(TRANSLATIONS[`stage.${key}`]).toBeDefined();
      expect(TRANSLATIONS[`stage.${key}`].zh).toBeTruthy();
      expect(TRANSLATIONS[`stage.${key}`].en).toBeTruthy();
    }
  });

  it('has all scene mode keys (5 modes)', () => {
    const sceneKeys = ['bloom', 'memory', 'starlight', 'timeline', 'garden'];
    for (const key of sceneKeys) {
      expect(TRANSLATIONS[`scene.${key}`]).toBeDefined();
    }
  });

  it('has all poem keys (6 poems)', () => {
    for (let i = 1; i <= 6; i++) {
      const poem = TRANSLATIONS[`poem.${i}`];
      expect(poem).toBeDefined();
      expect(poem.zh).toBeTruthy();
      expect(poem.en).toBeTruthy();
    }
  });

  it('has all shortcut keys', () => {
    const shortcuts = [
      'title', 'scroll', 'scroll.desc', 'arrows', 'arrows.desc',
      'space', 'space.desc', 'homeend', 'homeend.desc',
      'modes', 'modes.desc', 'fullscreen', 'fullscreen.desc',
      'helpkey', 'helpkey.desc', 'esc', 'esc.desc', 'autohide'
    ];
    for (const key of shortcuts) {
      expect(TRANSLATIONS[`shortcut.${key}`]).toBeDefined();
    }
  });

  it('no key contains empty strings for zh or en', () => {
    const emptyKeys = [];
    Object.entries(TRANSLATIONS).forEach(([key, entry]) => {
      if (entry.zh === '') emptyKeys.push(`${key}: empty zh`);
      if (entry.en === '') emptyKeys.push(`${key}: empty en`);
    });
    expect(emptyKeys).toEqual([]);
  });

  it('meta.description is an object, not a flat string', () => {
    const meta = TRANSLATIONS['meta.description'];
    expect(typeof meta).toBe('object');
    expect(typeof meta.zh).toBe('string');
    expect(typeof meta.en).toBe('string');
    expect(meta.zh.length).toBeGreaterThan(10);
  });

  it('v1.13.0 share keys exist', () => {
    expect(TRANSLATIONS['share.title']).toBeDefined();
    expect(TRANSLATIONS['share.copy']).toBeDefined();
    expect(TRANSLATIONS['share.copied']).toBeDefined();
    expect(TRANSLATIONS['share.error']).toBeDefined();
  });

  it('v1.13.0 update keys exist', () => {
    expect(TRANSLATIONS['update.available']).toBeDefined();
    expect(TRANSLATIONS['update.refresh']).toBeDefined();
    expect(TRANSLATIONS['update.dismiss']).toBeDefined();
  });

  it('v1.13.0 theme keys exist', () => {
    const themeKeys = ['midnight', 'sakura', 'ocean', 'forest', 'sunset', 'aurora'];
    for (const key of themeKeys) {
      expect(TRANSLATIONS[`theme.${key}`]).toBeDefined();
      expect(TRANSLATIONS[`theme.${key}`].zh).toBeTruthy();
      expect(TRANSLATIONS[`theme.${key}`].en).toBeTruthy();
    }
  });
});

describe('i18n Supported Locales', () => {
  it('supports zh, en, and ja', () => {
    const locales = new Set();
    Object.values(TRANSLATIONS).forEach(entry => {
      Object.keys(entry).forEach(lang => locales.add(lang));
    });
    expect(locales.has('zh')).toBe(true);
    expect(locales.has('en')).toBe(true);
    expect(locales.has('ja')).toBe(true);
  });

  it('has exactly 3 supported locales', () => {
    const locales = new Set();
    Object.values(TRANSLATIONS).forEach(entry => {
      Object.keys(entry).forEach(lang => locales.add(lang));
    });
    expect(locales.size).toBe(3);
  });
});
