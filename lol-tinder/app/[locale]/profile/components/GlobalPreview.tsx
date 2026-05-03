import { memo } from "react";
import { Languages, MicOff, ExternalLink, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGameName, getTagLine } from "@/src/lib/profile";

const GAME_META: Record<string, { label: string; iconSrc: string }> = {
  LOL:      { label: "League of Legends", iconSrc: "/games-icons/lol.png"      },
  TFT:      { label: "Teamfight Tactics", iconSrc: "/games-icons/tft.png"      },
  VALORANT: { label: "Valorant",          iconSrc: "/games-icons/valorant.png" },
  CS2:      { label: "Counter-Strike 2", iconSrc: "/games-icons/cs2.png"       },
};

interface GlobalPreviewProps {
  profile: any;
  user: any;
  selectedLangs: string[];
  enabledGames: string[];
}

const GlobalPreview = memo(({ profile, user, selectedLangs, enabledGames }: GlobalPreviewProps) => {
  const t = useTranslations("ProfilePage.preview");
  const params = useParams();
  const locale = params?.locale as string ?? "en";

  const hasDisplayName = !!profile?.display_name?.trim();
  // Riot account is shared between LOL and TFT — check lol profile
  const hasRiotAccount = !!(getGameName(profile, "lol") && getTagLine(profile, "lol"));

  const showDisplayNameWarning = !hasDisplayName;
  const showRiotWarning = hasDisplayName && !hasRiotAccount && enabledGames.some(g => g === 'LOL' || g === 'TFT');

  return (
    <section className="w-full lg:w-96 flex flex-col items-center lg:items-start">
      <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-white/5">
        <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent-color))]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {t('profileBadge')}
        </span>
      </div>

      <div className="relative mb-10 group">
        <div className="w-56 h-56 rounded-[2.5rem] bg-[rgb(var(--accent-color))] p-1 shadow-2xl shadow-[rgb(var(--accent-color)/0.2)] group-hover:rotate-3 transition-transform duration-500">
          <div className="w-full h-full rounded-[2.3rem] bg-zinc-950 overflow-hidden">
            <img
              src={user?.user_metadata?.avatar_url}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              alt="Avatar"
            />
          </div>
        </div>

        {profile?.has_mic === false && (
          <div className="absolute -top-2 -left-2 bg-red-500/20 p-2 rounded-full border border-red-500/50 backdrop-blur-md text-red-500 shadow-lg">
            <MicOff size={16} />
          </div>
        )}

        {user?.id && (
          <Link
            href={`/${locale}/profile/${user.id}`}
            target="_blank"
            className="absolute -bottom-2 -right-2 flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-[rgb(var(--accent-color))] hover:border-[rgb(var(--accent-color)/0.4)] hover:bg-zinc-800 transition-all shadow-lg opacity-0 group-hover:opacity-100"
            title="View public profile"
          >
            <ExternalLink size={14} />
          </Link>
        )}
      </div>

      <div className="text-center lg:text-left space-y-2 w-full">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
          {profile?.display_name || (
            <span className="text-zinc-700">{t('nicknamePlaceholder')}</span>
          )}
        </h1>

        {selectedLangs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center lg:justify-start">
            {selectedLangs.map((lang) => (
              <span
                key={lang}
                className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-400 border border-white/5 flex items-center gap-1"
              >
                <Languages size={10} className="text-[rgb(var(--accent-color))]" />
                {lang}
              </span>
            ))}
          </div>
        )}
      </div>

      {(showDisplayNameWarning || showRiotWarning) && (
        <div className="mt-6 w-full space-y-2">
          {showDisplayNameWarning && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400/80">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed">
                {t('missingDisplayName')}
              </p>
            </div>
          )}
          {showRiotWarning && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400/80">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed">
                {t('missingRiotAccount')}
              </p>
            </div>
          )}
        </div>
      )}

      {enabledGames.length > 0 && (
        <div className="mt-10 w-full">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1 mb-3">
            {t('activeGames')}
          </p>
          <div className="flex items-center gap-2">
            {enabledGames.map((gameId) => {
              const meta = GAME_META[gameId];
              if (!meta) return null;
              return (
                <img
                  key={gameId}
                  src={meta.iconSrc}
                  alt={meta.label}
                  title={meta.label}
                  className="w-8 h-8 object-contain rounded-lg"
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
});

export default GlobalPreview;