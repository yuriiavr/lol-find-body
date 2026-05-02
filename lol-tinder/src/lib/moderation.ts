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
  if (!process.env.GEMINI_API_KEY) {
    console.error('[moderation] ❌ GEMINI_API_KEY is not set in environment variables')
    return 'approved'
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: buildPrompt(comment),
    })


    const raw = response.text?.trim().toUpperCase() ?? ''

    if (raw.includes('APPROVE')) { return 'approved' }
    if (raw.includes('REJECT'))  { return 'rejected' }
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