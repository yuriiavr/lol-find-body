import { describe, it, expect, vi, beforeEach } from 'vitest';

// Тримаємо поточний mock-клієнт у hoisted-стані, щоб міняти його в кожному тесті.
const h = vi.hoisted(() => ({ client: null as any }));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => h.client,
}));
vi.mock('@/src/lib/moderation', () => ({
  moderateComment: async () => 'approved',
}));

import {
  updateMatchStatus,
  sendMessage,
  getMessages,
} from '@/app/[locale]/matches/actions';

// Мінімальний chainable-mock supabase. `results` — це результати в порядку
// викликів .from(): кожен .from() віддає наступний.
function makeClient(opts: { user: any; results?: any[] }) {
  const results = opts.results ?? [];
  let idx = 0;
  return {
    auth: { getUser: async () => ({ data: { user: opts.user } }) },
    from() {
      const result = results[idx] ?? { data: null, error: null };
      idx++;
      const b: any = {
        select: () => b,
        update: () => b,
        insert: () => b,
        delete: () => b,
        eq: () => b,
        neq: () => b,
        or: () => b,
        order: () => b,
        single: () => Promise.resolve(result),
        maybeSingle: () => Promise.resolve(result),
        then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
      };
      return b;
    },
  };
}

beforeEach(() => {
  h.client = null;
});

describe('updateMatchStatus', () => {
  it('rejects unauthenticated callers', async () => {
    h.client = makeClient({ user: null });
    expect(await updateMatchStatus('m1', 'ACCEPTED')).toEqual({ error: 'Unauthorized' });
  });

  it('errors when no row was updated (caller is not the recipient)', async () => {
    h.client = makeClient({ user: { id: 'u1' }, results: [{ data: [], error: null }] });
    expect(await updateMatchStatus('m1', 'ACCEPTED')).toEqual({
      error: 'Match not found or not permitted',
    });
  });

  it('succeeds when the recipient updates an existing match', async () => {
    h.client = makeClient({ user: { id: 'u1' }, results: [{ data: [{ id: 'm1' }], error: null }] });
    expect(await updateMatchStatus('m1', 'ACCEPTED')).toEqual({ success: true });
  });
});

describe('sendMessage', () => {
  it('rejects unauthenticated callers', async () => {
    h.client = makeClient({ user: null });
    expect(await sendMessage('m1', 'hi')).toEqual({ error: 'Unauthorized' });
  });

  it('rejects empty content', async () => {
    h.client = makeClient({ user: { id: 'u1' } });
    expect(await sendMessage('m1', '   ')).toEqual({ error: 'Empty message' });
  });

  it('rejects non-participants', async () => {
    h.client = makeClient({ user: { id: 'u1' }, results: [{ data: null, error: null }] });
    expect(await sendMessage('m1', 'hi')).toEqual({ error: 'Not a participant of this match' });
  });

  it('rejects messages to a not-yet-accepted match', async () => {
    h.client = makeClient({
      user: { id: 'u1' },
      results: [{ data: { id: 'm1', status: 'PENDING' }, error: null }],
    });
    expect(await sendMessage('m1', 'hi')).toEqual({ error: 'Match is not accepted' });
  });

  it('inserts when participant and match is accepted', async () => {
    h.client = makeClient({
      user: { id: 'u1' },
      results: [
        { data: { id: 'm1', status: 'ACCEPTED' }, error: null },
        { data: null, error: null },
      ],
    });
    expect(await sendMessage('m1', 'hi')).toEqual({ success: true });
  });
});

describe('getMessages', () => {
  it('rejects unauthenticated callers', async () => {
    h.client = makeClient({ user: null });
    const res = await getMessages('m1');
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('Unauthorized');
  });

  it('forbids non-participants', async () => {
    h.client = makeClient({ user: { id: 'u1' }, results: [{ data: null, error: null }] });
    const res = await getMessages('m1');
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('Forbidden');
  });

  it('returns messages for a participant', async () => {
    h.client = makeClient({
      user: { id: 'u1' },
      results: [
        { data: { id: 'm1' }, error: null },
        { data: [{ id: 'msg1' }], error: null },
      ],
    });
    const res = await getMessages('m1');
    expect(res.error).toBeNull();
    expect(res.data).toEqual([{ id: 'msg1' }]);
  });
});
