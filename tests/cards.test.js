import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

const cardsPath = path.join(__dirname, '..', 'data', 'cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

describe('Card Data Integrity', () => {
  it('cards.json is a non-empty array', () => {
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('all cards have required fields', () => {
    const required = ['id', 'title', 'titleEn', 'desc', 'emoji', 'gradient', 'color', 'category', 'tags', 'sortWeight'];
    for (const card of cards) {
      for (const field of required) {
        expect(card).toHaveProperty(field);
      }
    }
  });

  it('card IDs are unique positive integers', () => {
    const ids = cards.map(c => c.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThan(0);
    }
  });

  it('all card colors are valid hex', () => {
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    for (const card of cards) {
      expect(card.color).toMatch(hexRe);
    }
  });

  it('all card gradients contain linear-gradient', () => {
    for (const card of cards) {
      expect(card.gradient).toContain('linear-gradient');
    }
  });

  it('sortWeight values are in 0-100 range', () => {
    for (const card of cards) {
      expect(card.sortWeight).toBeGreaterThanOrEqual(0);
      expect(card.sortWeight).toBeLessThanOrEqual(100);
    }
  });

  it('all cards have at least one tag', () => {
    for (const card of cards) {
      expect(Array.isArray(card.tags)).toBe(true);
      expect(card.tags.length).toBeGreaterThan(0);
    }
  });

  it('categories are valid', () => {
    const validCategories = ['日常', '浪漫', '旅行', '季节'];
    for (const card of cards) {
      expect(validCategories).toContain(card.category);
    }
  });
});

describe('Search & Filter Logic', () => {
  it('search by title returns results', () => {
    const results = cards.filter(c => c.title.includes('安静'));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(c => c.title.includes('安静'))).toBe(true);
  });

  it('search returns empty for non-existent term', () => {
    const results = cards.filter(c =>
      c.title.includes('XYZNONEXISTENT12345') || c.desc.includes('XYZNONEXISTENT12345')
    );
    expect(results.length).toBe(0);
  });

  it('category filtering works', () => {
    const categories = [...new Set(cards.map(c => c.category))];
    expect(categories.length).toBeGreaterThanOrEqual(4);
    for (const cat of categories) {
      const filtered = cards.filter(c => c.category === cat);
      expect(filtered.length).toBeGreaterThan(0);
    }
  });

  it('pagination covers all cards without overlap', () => {
    const pageSize = 7;
    const totalPages = Math.ceil(cards.length / pageSize);
    const allCards = [];
    for (let p = 0; p < totalPages; p++) {
      allCards.push(...cards.slice(p * pageSize, (p + 1) * pageSize));
    }
    expect(allCards.length).toBe(cards.length);
  });
});

describe('Batch & Favorites Logic', () => {
  it('batch lookup handles valid IDs', () => {
    const ids = [1, 5, 10];
    const results = cards.filter(c => ids.includes(c.id));
    expect(results.length).toBe(ids.length);
  });

  it('batch lookup handles mix of valid and invalid IDs', () => {
    const ids = [1, 2, 99999];
    const results = cards.filter(c => ids.includes(c.id));
    expect(results.length).toBe(2);
  });

  it('batch lookup handles empty ID list', () => {
    const results = cards.filter(c => [].includes(c.id));
    expect(results.length).toBe(0);
  });
});
