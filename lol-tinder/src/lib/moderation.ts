// src/lib/moderation.ts
import { GoogleGenAI } from '@google/genai'

export type ModerationResult = 'approved' | 'rejected' | 'pending'

const buildPrompt = (comment: string) =>
  `You are a content moderation system for a gaming platform. Analyze the following user comment and classify it.

Rules:
- REJECT if the comment contains: hate speech, racism, sexism, homophobia, death threats, doxxing, severe harassment, slurs, calls to violence.
- PENDING if the comment is ambiguous, mildly toxic, passive-aggressive, contains mild insults, or is unclear in intent.
- APPROVE if the comment is neutral, constructive, positive, or gaming-related feedback.

Respond with ONLY one word: APPROVE, REJECT, or PENDING. No explanation.

Comment: "${comment.replace(/"/g, '\\"')}"`

export async function moderateComment(comment: string): Promise<ModerationResult> {
  console.log('[moderation] called, comment preview:', comment.slice(0, 80))

  if (!process.env.GEMINI_API_KEY) {
    console.error('[moderation] ❌ GEMINI_API_KEY is not set in environment variables')
    return 'approved'
  }
  console.log('[moderation] ✅ API key found, length:', process.env.GEMINI_API_KEY.length)

  try {
    console.log('[moderation] creating GoogleGenAI client...')
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    console.log('[moderation] sending request to gemini-3.1-flash-preview...')
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: buildPrompt(comment),
    })

    console.log('[moderation] raw response:', JSON.stringify(response, null, 2))

    const raw = response.text?.trim().toUpperCase() ?? ''
    console.log('[moderation] parsed text:', raw)

    if (raw.includes('APPROVE')) { console.log('[moderation] → approved'); return 'approved' }
    if (raw.includes('REJECT'))  { console.log('[moderation] → rejected'); return 'rejected' }
    console.log('[moderation] → pending (no clear verdict in response)')
    return 'pending'
  } catch (err: any) {
    console.error('[moderation] ❌ Exception caught:')
    console.error('  message:', err?.message)
    console.error('  status:', err?.status)
    console.error('  statusText:', err?.statusText)
    console.error('  stack:', err?.stack)
    try {
      console.error('  full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    } catch {}
    return 'pending'
  }
}