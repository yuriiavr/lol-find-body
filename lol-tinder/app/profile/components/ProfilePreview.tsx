import { memo, useState, useCallback } from "react";
import { Trophy, MicOff, Languages, Sword, Copy, Check } from "lucide-react";
import RankPanel from "./RankPanel";

interface ProfilePreviewProps {
  profile: any;
  user: any;
  selectedLangs: string[];
  activeTab: "LOL" | "TFT" | "VALORANT";
  riotStats: any;
  tftStats: any;
  valStats: any;
  selectedQueues: string[];
  getGameValue: (field: string) => string;
}

const ProfilePreview = memo(
  ({
    profile,
    user,
    selectedLangs,
    activeTab,
    riotStats,
    tftStats,
    valStats,
    selectedQueues,
    getGameValue,
  }: ProfilePreviewProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
      const name = getGameValue("game_name");
      const tag = getGameValue("tag_line");
      if (name && tag) {
        navigator.clipboard.writeText(`${name}#${tag}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }, [getGameValue]);

    return (
      <section className="w-full lg:w-96 flex flex-col items-center lg:items-start">
        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-white/5">
          <div
            className={`w-2 h-2 rounded-full bg-[rgb(var(--accent-color))]`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {activeTab}
          </span>
        </div>
        <div className="relative mb-10 group">
          <div
            className={`w-56 h-56 rounded-[2.5rem] bg-[rgb(var(--accent-color))] p-1 shadow-2xl shadow-[rgb(var(--accent-color)/0.2)] group-hover:rotate-3 transition-transform duration-500`}
          >
            <div className="w-full h-full rounded-[2.3rem] bg-zinc-950 overflow-hidden">
              <img
                src={user?.user_metadata?.avatar_url}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                alt="Avatar"
              />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-xl">
            <Trophy size={24} className="text-[rgb(var(--accent-color))]" />
          </div>
          {profile.has_mic === false && (
            <div className="absolute -top-2 -left-2 bg-red-500/20 p-2 rounded-full border border-red-500/50 backdrop-blur-md text-red-500 shadow-lg">
              <MicOff size={16} />
            </div>
          )}
        </div>

        <div className="text-center lg:text-left space-y-2">
          <div className="flex items-start gap-3 justify-center lg:justify-start group/name">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              {profile.display_name || getGameValue("game_name") || "Summoner"}
              <span className="text-slate-600 block text-2xl mt-1">
                #{getGameValue("tag_line") || "EUW"}
              </span>
            </h1>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl cursor-pointer text-zinc-500 hover:text-[rgb(var(--accent-color))] hover:border-[rgb(var(--accent-color)/0.2)] transition-all opacity-0 group-hover/name:opacity-100 mt-2"
              title="Copy Riot ID"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>

          {selectedLangs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 justify-center lg:justify-start">
              {selectedLangs.map((lang) => (
                <span
                  key={lang}
                  className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-400 border border-white/5 flex items-center gap-1"
                >
                  <Languages
                    size={10}
                    className="text-[rgb(var(--accent-color))]"
                  />{" "}
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 w-full space-y-4">
          {activeTab === "LOL" ? (
            <>
              <RankPanel
                title="Solo Queue"
                value={riotStats?.solo || profile.solo_rank}
                isActive={selectedQueues.includes("Solo/Duo")}
                isMain={true}
                stats={
                  riotStats && riotStats.solo_wins + riotStats.solo_losses > 0
                    ? {
                        wins: riotStats.solo_wins,
                        losses: riotStats.solo_losses,
                      }
                    : null
                }
              />
              <RankPanel
                title="Flex Queue"
                value={riotStats?.flex || profile.flex_rank}
                isActive={selectedQueues.includes("Flex")}
                isMain={false}
                stats={
                  riotStats && riotStats.flex_wins + riotStats.flex_losses > 0
                    ? {
                        wins: riotStats.flex_wins,
                        losses: riotStats.flex_losses,
                      }
                    : null
                }
              />
            </>
          ) : activeTab === "TFT" ? (
            <RankPanel
              title="TFT Ranked"
              value={tftStats ? `${tftStats.rank}` : profile.tft_rank}
              isActive={true}
              isMain={true}
              stats={
                (tftStats?.wins ?? profile.tft_wins) + (tftStats?.losses ?? profile.tft_losses) > 0
                  ? { 
                      wins: tftStats?.wins ?? profile.tft_wins, 
                      losses: tftStats?.losses ?? profile.tft_losses 
                    }
                  : null
              }
            />
          ) : (
            <RankPanel
              title="VALORANT Rank"
              value={valStats?.rankName || profile.val_rank}
              isActive={true}
              isMain={true}
              stats={
                valStats && valStats.wins + valStats.losses > 0
                  ? { wins: valStats.wins, losses: valStats.losses }
                  : null
              }
            />
          )}

          {activeTab !== "TFT" && (
            <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">
                Position
              </span>
              <div className="flex items-center gap-2">
                <Sword size={14} className="text-[rgb(var(--accent-color))]" />
                <span className="font-bold text-sm uppercase italic">
                  {getGameValue("main_role") || "FILL"}
                </span>
              </div>
            </div>
          )}

          {selectedQueues.some((q) => !["Solo/Duo", "Flex"].includes(q)) && (
            <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
              {selectedQueues
                .filter((q) => !["Solo/Duo", "Flex"].includes(q))
                .map((q) => (
                  <span
                    key={q}
                    className={`text-[9px] bg-[rgb(var(--accent-color)/0.1)] px-2 py-1 rounded text-[rgb(var(--accent-color))] border border-[rgb(var(--accent-color)/0.2)] font-black uppercase tracking-widest`}
                  >
                    {q}
                  </span>
                ))}
            </div>
          )}
        </div>
      </section>
    );
  },
);

export default ProfilePreview;
