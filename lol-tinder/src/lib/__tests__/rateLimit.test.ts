import { describe, it, expect, vi, afterEach } from 'vitest';
import { rateLimit } from '@/src/lib/rateLimit';

describe('rateLimit', () => {
  afterEach(() => vi.useRealTimers());

  it('allows up to the limit then blocks', () => {
    const key = 'test-allow-block';
    expect(rateLimit(key, 3, 1000)).toBe(true);
    expect(rateLimit(key, 3, 1000)).toBe(true);
    expect(rateLimit(key, 3, 1000)).toBe(true);
    expect(rateLimit(key, 3, 1000)).toBe(false);
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    const key = 'test-reset';
    expect(rateLimit(key, 1, 1000)).toBe(true);
    expect(rateLimit(key, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 1, 1000)).toBe(true);
  });

  it('keeps separate keys independent', () => {
    expect(rateLimit('k-a', 1, 1000)).toBe(true);
    expect(rateLimit('k-b', 1, 1000)).toBe(true);
  });
});
