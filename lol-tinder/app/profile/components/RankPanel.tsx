import { Star } from "lucide-react";
import { memo } from "react";

interface RankPanelProps {
  title: string;
  value: string;
  isActive: boolean;
  isMain?: boolean;
  stats?: { wins: number; losses: number } | null;
}

const RankPanel = memo(({ title, value, isActive, isMain = false, stats }: RankPanelProps) => {
  const winNum = Number(stats?.wins || 0);
  const lossNum = Number(stats?.losses || 0);
  const totalGames = winNum + lossNum;
  const winRate = totalGames > 0 ? Math.round((winNum / totalGames) * 100) : 0;

  return (
    <div className={`modern-panel p-5 transition-all ${isActive ? 'bg-[rgb(var(--accent-color)/0.1)] border-[rgb(var(--accent-color)/0.4)]' : 'bg-white/5 opacity-60'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black uppercase text-slate-500">{title}</span>
        {isMain && <Star size={12} className="text-[rgb(var(--accent-color))]" />}
      </div>
      <p className={`${isMain ? 'text-2xl' : 'text-xl'} font-bold ${isMain ? 'text-white' : 'text-slate-300'} uppercase italic`}>{value || "Unranked"}</p>
      {stats && totalGames > 0 && (
        <div className="flex gap-2 mt-1 text-[10px] font-bold">
           <span className="text-emerald-500">{winRate}% WR</span>
           <span className="text-slate-500">({totalGames} games)</span>
        </div>
      )}
    </div>
  );
});

export default RankPanel;