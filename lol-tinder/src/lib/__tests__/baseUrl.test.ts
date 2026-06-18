import { describe, it, expect, afterEach } from 'vitest';
import { getBaseUrl } from '@/src/lib/baseUrl';

describe('getBaseUrl', () => {
  const orig = { ...process.env };
  afterEach(() => {
    process.env = { ...orig };
  });

  it('prefers NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example';
    expect(getBaseUrl()).toBe('https://app.example');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site.example';
    expect(getBaseUrl()).toBe('https://site.example');
  });

  it('falls back to localhost when nothing is set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });
});
