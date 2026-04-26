'use client'

import { memo } from 'react'
import { ExternalLink, Loader2, Check } from 'lucide-react'

interface ProfileIntelProps {
  profile: any
  activeGame: 'LOL' | 'TFT' | 'VALORANT' | null
  topChamps: any[]
  isMatched: boolean
  isRequesting: boolean
  requestSent: boolean
  handleMatch: () => void
}

export const ProfileIntel = memo(({
  profile,
  activeGame,
  topChamps,
  isMatched,
  isRequesting,
  requestSent,
  handleMatch
}: ProfileIntelProps) => {
  const bio = (activeGame === 'LOL' ? profile.bio : activeGame === 'TFT' ? profile.tft_bio : profile.val_bio) || "This summoner prefers to keep a low profile."

  return (
    <div className="modern-panel p-8 bg-slate-900/20">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-white/5 pb-4">Summoner Intel</h3>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Biography & Playstyle</p>
        <p className="text-2xl text-slate-200 leading-relaxed italic font-medium">{bio}</p>
      </div>

      {activeGame === 'LOL' && topChamps.length > 0 && (
        <div className="mt-10 border-t border-white/5 pt-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Champions Mastery</p>
            <a 
              href={`https://www.op.gg/summoners/${profile.region.toLowerCase()}/${encodeURIComponent(profile.game_name)}-${encodeURIComponent(profile.tag_line)}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-[#5383e8] hover:bg-[#4066b8] text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-500/10"
            >
              <ExternalLink size={12} /> View on OP.GG
            </a>
          </div>
          <div className="flex flex-wrap gap-3">
            {topChamps.map((champ) => (
              <div key={champ.id} className="group relative flex flex-col items-center" title={`${champ.name}: ${champ.points.toLocaleString()} pts`}>
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 group-hover:border-[rgb(var(--accent-color)/0.5)] transition-all shadow-lg">
                  <img src={champ.icon} alt={champ.name} />
                </div>
                <div className="absolute -bottom-2 bg-zinc-950/90 backdrop-blur-sm text-[rgb(var(--accent-color))] text-[8px] font-black px-2 py-0.5 rounded-full border border-[rgb(var(--accent-color)/0.3)] shadow-sm flex flex-col items-center min-w-[28px]">
                  <span>{new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(champ.points)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-10 flex flex-wrap gap-4">
        {!isMatched && (
          <button 
            onClick={handleMatch}
            disabled={isRequesting || requestSent}
            className={`btn-modern px-12 py-5 text-base transition-all ${requestSent ? 'opacity-50 border-emerald-500 text-emerald-400' : ''}`}
          >
            {isRequesting ? <Loader2 className="animate-spin" /> : 
             requestSent ? <span className="flex items-center gap-2"><Check size={20} /> Request Sent</span> : 
             "Send Team Request"}
          </button>
        )}
      </div>
    </div>
  )
})