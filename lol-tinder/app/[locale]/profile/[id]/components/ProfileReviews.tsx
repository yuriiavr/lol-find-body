'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Loader2, MessageCircle, Clock, XCircle } from 'lucide-react'

interface ProfileReviewsProps {
  id: string
  isMatched: boolean
  reviews: any[]
  reviewComment: string
  setReviewComment: (v: string) => void
  isSubmittingReview: boolean
  handleSubmitReview: () => void
  myReviewStatus?: 'approved' | 'pending' | 'rejected' | null // ← новий проп
}

export const ProfileReviews = memo(({
  isMatched,
  reviews,
  reviewComment,
  setReviewComment,
  isSubmittingReview,
  handleSubmitReview,
  myReviewStatus,
}: ProfileReviewsProps) => {
  const t = useTranslations('ProfilePage.reviews')

  return (
    <div className="modern-panel p-8 bg-zinc-950/40">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('title')}</h3>
      </div>

      {isMatched && (
        <div className="mb-10">
          {/* Статус модерації — показується тільки автору */}
          {myReviewStatus === 'pending' && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock size={14} className="shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('moderation.pending')}
              </span>
            </div>
          )}
          {myReviewStatus === 'rejected' && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <XCircle size={14} className="shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t('moderation.rejected')}
              </span>
            </div>
          )}

          <div className="relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden focus-within:border-[rgb(var(--accent-color)/0.4)] transition-colors duration-200">
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              className="w-full bg-transparent px-5 pt-5 pb-16 text-sm text-slate-200 outline-none resize-none min-h-[120px] placeholder:text-zinc-600"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                {reviewComment.length > 0 ? `${reviewComment.length} chars` : t('leaveMessage')}
              </span>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[rgb(var(--accent-color))] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                {isSubmittingReview ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                {t('submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div key={rev.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img src={rev.reviewer.avatar_url} className="w-8 h-8 rounded-lg border border-white/10" alt="" />
                  <span className="text-sm font-bold text-zinc-300">{rev.reviewer.display_name}</span>
                </div>
                <span className="text-[10px] text-zinc-600">{new Date(rev.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-zinc-400">{rev.comment}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-20">
            <MessageCircle size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-tighter">{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  )
})