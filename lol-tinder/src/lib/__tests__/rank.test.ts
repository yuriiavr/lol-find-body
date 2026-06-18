import { describe, it, expect } from 'vitest';
import { getRankWeight, computeWinrate, RANK_PRIORITY } from '@/src/lib/rank';

describe('getRankWeight', () => {
  it('orders apex tiers above the rest (lower = better)', () => {
    expect(getRankWeight('CHALLENGER')).toBeLessThan(getRankWeight('MASTER'));
    expect(getRankWeight('MASTER')).toBeLessThan(getRankWeight('DIAMOND'));
    expect(getRankWeight('DIAMOND')).toBeLessThan(getRankWeight('GOLD'));
    expect(getRankWeight('GOLD')).toBeLessThan(getRankWeight('IRON'));
  });

  it('ignores division and is case-insensitive ("GOLD II" → GOLD)', () => {
    expect(getRankWeight('GOLD II')).toBe(getRankWeight('GOLD'));
    expect(getRankWeight('gold ii')).toBe(getRankWeight('GOLD'));
  });

  it('does not confuse MASTER with GRANDMASTER', () => {
    expect(getRankWeight('GRANDMASTER')).not.toBe(getRankWeight('MASTER'));
    expect(getRankWeight('GRANDMASTER')).toBe(RANK_PRIORITY.indexOf('GRANDMASTER'));
  });

  it('returns 100 for null/undefined/unknown', () => {
    expect(getRankWeight(null)).toBe(100);
    expect(getRankWeight(undefined)).toBe(100);
    expect(getRankWeight('NOPE')).toBe(100);
  });
});

describe('computeWinrate', () => {
  it('computes percentage from wins/losses', () => {
    expect(computeWinrate(60, 40)).toBe(60);
    expect(computeWinrate(1, 1)).toBe(50);
  });

  it('returns 0 when there are no games (avoids divide-by-zero)', () => {
    expect(computeWinrate(0, 0)).toBe(0);
    expect(computeWinrate(undefined, undefined)).toBe(0);
  });

  it('coerces string inputs and bad values safely', () => {
    expect(computeWinrate('30', '10')).toBe(75);
    expect(computeWinrate('abc', 10)).toBe(0);
  });
});
