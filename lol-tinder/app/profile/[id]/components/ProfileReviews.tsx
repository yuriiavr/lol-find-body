'use client'

import { memo } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { StarRating } from '@/src/components/StarRating'

interface ProfileReviewsProps {
  id: string
  isMatched: boolean
  reviews: any[]
  reviewComment: string
  setReviewComment: (v: string) => void
  behaviorRating: number
  setBehaviorRating: (v: number) => void
  skillRating: number
  setSkillRating: (v: number) => void
  isSubmittingReview: boolean
  handleSubmitReview: () => void
}

export const ProfileReviews = memo(({
  isMatched,
  reviews,
  reviewComment,
  setReviewComment,
  behaviorRating,
  setBehaviorRating,
  skillRating,
  setSkillRating,
  isSubmittingReview,
  handleSubmitReview
}: ProfileReviewsProps) => {
  return (
    <div className="modern-panel p-8 bg-zinc-950/40">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Player Reviews</h3>
      </div>

      {isMatched && (
        <div className="mb-12 p-6 bg-[rgb(var(--accent-color)/0.05)] rounded-2xl border border-[rgb(var(--accent-color)/0.1)]">
          <h4 className="text-sm font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest mb-6">Leave your feedback</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Communication & Attitude</span>
              <StarRating rating={behaviorRating} interactive onChange={setBehaviorRating} size={18} />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Mechanical Skill</span>
              <StarRating rating={skillRating} interactive onChange={setSkillRating} size={18} />
            </div>
          </div>
          <div className="relative">
            <textarea 
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was your experience playing together?"
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-sm text-slate-200 outline-none focus:border-[rgb(var(--accent-color)/0.5)] h-24 resize-none mb-4"
            />
            <button 
              onClick={handleSubmitReview}
              disabled={isSubmittingReview}
              className="btn-modern py-3 px-8 text-xs ml-auto flex items-center gap-2"
            >
              {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Save Review
            </button>
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
                  <span className="text-sm font-bold text-zinc-300">{rev.reviewer.game_name}</span>
                </div>
                <div className="flex gap-4">
                  <RatingItem label="Attitude" rating={rev.behavior_rating} />
                  <RatingItem label="Skill" rating={rev.skill_rating} />
                </div>
              </div>
              <p className="text-sm text-zinc-400 italic">{rev.comment || "No comment left."}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-20">
            <MessageSquare size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-tighter">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  )
})

const RatingItem = memo(({ label, rating }: { label: string, rating: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] font-bold text-zinc-600 uppercase">{label}</span>
    <StarRating rating={rating} size={8} className="opacity-80" />
  </div>
))
RatingItem.displayName = 'RatingItem'