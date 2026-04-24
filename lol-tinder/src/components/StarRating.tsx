'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  size = 14,
  interactive = false,
  onChange,
  className = ""
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className={`flex gap-0.5 ${className}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`transition-all ${star <= rating ? 'text-[rgb(var(--accent-color))]' : 'text-zinc-800'} ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star 
            size={size} 
            fill={star <= Math.round(rating) ? "currentColor" : "none"} 
          />
        </button>
      ))}
    </div>
  )
}