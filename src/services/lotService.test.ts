import { describe, expect, it } from 'vitest';
import { matchesCategory } from './lotService';

describe('matchesCategory (FIX 4)', () => {
  it('matches regardless of case casing and whitespace', () => {
    expect(matchesCategory('Laptop', ['LAPTOP', 'PCB'])).toBe(true);
    expect(matchesCategory('LAPTOP', ['laptop', 'pcb'])).toBe(true);
    expect(matchesCategory('  LaPtOp  ', ['Laptop'])).toBe(true);
    expect(matchesCategory('Mobile Phone', ['MOBILE PHONE', 'BATTERY'])).toBe(true);
  });

  it('rejects unmatched categories', () => {
    expect(matchesCategory('Desktop', ['Laptop', 'PCB'])).toBe(false);
    expect(matchesCategory('Cable', ['BATTERY'])).toBe(false);
  });

  it('allows all lots when acceptedCategories is empty or undefined', () => {
    expect(matchesCategory('Laptop', [])).toBe(true);
    expect(matchesCategory('Laptop', undefined)).toBe(true);
  });
});
