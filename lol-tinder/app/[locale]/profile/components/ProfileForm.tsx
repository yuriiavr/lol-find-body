import { memo, useState, useRef, useEffect } from "react";
import {
  Settings,
  User as UserIcon,
  Tag,
  Globe,
  Sword,
  LayoutGrid,
  Loader2,
  Save,
  Gamepad2,
  Trophy,
  Zap,
  ChevronDown,
  Check,
  Shield,
  Target,
  Star,
  Crosshair,
  Crown,
  Map,
  Users,
  Shuffle,
  BookOpen,
} from "lucide-react";
import {
  FormInput,
  FormSelect,
  FormSwitch,
  FormTextArea,
} from "@/src/components/ui/FormFields";
import GlobalSettingsSection from "./GlobalSettingsSection";
import { useTranslations } from "next-intl";
import {
  getGameName,
  getTagLine,
  getRegion,
  getRank,
  getBio,
  getRole,
  getExtra,
  type GameKey,
} from "@/src/lib/profile";
import { motion, AnimatePresence } from "framer-motion";

// ── Constants ─────────────────────────────────────────────────────────────────

const POPULAR_LANGUAGES = [
  "Ukrainian", "English", "Polish", "German", "French",
  "Spanish", "Italian", "Romanian", "Dutch", "Hungarian", "Czech",
];

const VALORANT_RANKS = [
  "Unranked",
  "Iron 1", "Iron 2", "Iron 3",
  "Bronze 1", "Bronze 2", "Bronze 3",
  "Silver 1", "Silver 2", "Silver 3",
  "Gold 1", "Gold 2", "Gold 3",
  "Platinum 1", "Platinum 2", "Platinum 3",
  "Diamond 1", "Diamond 2", "Diamond 3",
  "Ascendant 1", "Ascendant 2", "Ascendant 3",
  "Immortal 1", "Immortal 2", "Immortal 3",
  "Radiant",
];

const VALORANT_AGENTS = [
  "Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher",
  "Deadlock", "Fade", "Gekko", "Harbor", "Iso", "Jett", "KAY/O",
  "Killjoy", "Neon", "Omen", "Phoenix", "Raze", "Reyna", "Sage",
  "Skye", "Sova", "Viper", "Vyse", "Yoru",
];

const GAMES = [
  {
    id: "LOL", name: "League of Legends", icon: Sword, description: "5v5 MOBA",
    accent: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  },
  {
    id: "TFT", name: "Teamfight Tactics", icon: Gamepad2, description: "Auto Battler",
    accent: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  },
  {
    id: "VALORANT", name: "Valorant", icon: Zap, description: "5v5 Tactical FPS",
    accent: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileFormProps {
  profile: any;
  selectedLangs: string[];
  onToggleLang: (lang: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleGameInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  toggleQueue: (queue: string) => void;
  toggleGame: (game: string) => void;
  activeTab: "LOL" | "TFT" | "VALORANT";
  enabledGames: string[];
  selectedQueues: string[];
  selectedAgents?: string[];
  onToggleAgent?: (agent: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onSetActiveTab: (tab: "LOL" | "TFT" | "VALORANT") => void;
  loading: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fires a synthetic change event to reuse handleGameInputChange */
function fireChange(handler: (e: any) => void, name: string, value: string) {
  handler({ target: { name, value, type: "select" } } as any);
}

// ── Game Selector Dropdown ────────────────────────────────────────────────────

function GameSelector({ activeTab, enabledGames, onSetActiveTab }: {
  activeTab: "LOL" | "TFT" | "VALORANT";
  enabledGames: string[];
  onSetActiveTab: (tab: "LOL" | "TFT" | "VALORANT") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = GAMES.find((g) => g.id === activeTab)!;
  const Icon = active.icon;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl border transition-all cursor-pointer ${active.accent.bg} ${active.accent.border} hover:brightness-110`}
      >
        <div className={`p-2 rounded-xl ${active.accent.bg}`}>
          <Icon size={18} className={active.accent.text} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none mb-0.5">
            Game profile
          </p>
          <p className="text-sm font-bold text-white">{active.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {enabledGames.includes(activeTab) && (
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
          <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {GAMES.map((game) => {
              const GIcon = game.icon;
              const isActive = activeTab === game.id;
              const isEnabled = enabledGames.includes(game.id);
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => { onSetActiveTab(game.id as any); setOpen(false); }}
                  className={`flex items-center gap-3 w-full px-5 py-3.5 text-left transition-all group ${isActive ? game.accent.bg : "hover:bg-white/5"}`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? game.accent.bg : "bg-white/5 group-hover:bg-white/10"}`}>
                    <GIcon size={15} className={isActive ? game.accent.text : "text-zinc-500 group-hover:text-zinc-300"} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>{game.name}</p>
                    <p className="text-[10px] text-zinc-600">{game.description}</p>
                  </div>
                  {isEnabled && <span className="text-[9px] font-black uppercase text-emerald-500">Active</span>}
                  {isActive && <Check size={14} className={game.accent.text} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Visibility Toggle ─────────────────────────────────────────────────────────

function VisibilityRow({ activeTab, enabledGames, toggleGame, t }: any) {
  const game = GAMES.find((g) => g.id === activeTab)!;
  return (
    <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${game.accent.bg} ${game.accent.border}`}>
      <div>
        <p className="text-xs font-bold text-white mb-0.5">{t("ProfilePage.editor.postCard")}</p>
        <p className="text-[10px] text-zinc-500">{t("ProfilePage.editor.postCardDesc", { game: activeTab })}</p>
      </div>
      <FormSwitch label="" checked={enabledGames.includes(activeTab)} onChange={() => toggleGame(activeTab)} name="isGameEnabled" />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, accentClass, children, trailing }: {
  icon: any; title: string; accentClass: string; children: React.ReactNode; trailing?: React.ReactNode;
}) {
  return (
    <div className="modern-panel bg-white/[0.02] border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={accentClass} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">{title}</span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

// ── LoL Form ──────────────────────────────────────────────────────────────────

function LolForm({ getGameValue, handleGameInputChange, selectedQueues, toggleQueue }: any) {
  const lolRoles = [
    { value: "TOP",     label: "Top",     icon: Shield  },
    { value: "JUNGLE",  label: "Jungle",  icon: Map     },
    { value: "MID",     label: "Mid",     icon: Crosshair },
    { value: "ADC",     label: "ADC",     icon: Target  },
    { value: "SUPPORT", label: "Support", icon: Star    },
    { value: "FILL",    label: "Fill",    icon: Shuffle },
  ];
  const queues = ["Solo/Duo", "Flex", "Draft", "ARAM", "Arena", "Quick Play", "Clash"];
  const currentRole = getGameValue("role") || "FILL";

  return (
    <div className="space-y-4">
      {/* Role — visual grid selector */}
      <Section icon={Sword} title="Your lane" accentClass="text-amber-400">
        <div className="grid grid-cols-3 gap-2">
          {lolRoles.map(({ value, label, icon: RIcon }) => {
            const on = currentRole === value;
            return (
              <button key={value} type="button"
                onClick={() => fireChange(handleGameInputChange, "role", value)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all cursor-pointer ${
                  on ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                     : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                <RIcon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Queues */}
      <Section icon={LayoutGrid} title="Queues you play" accentClass="text-amber-400">
        <div className="flex flex-wrap gap-2">
          {queues.map((q) => (
            <button key={q} type="button" onClick={() => toggleQueue(q)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >{q}</button>
          ))}
        </div>
      </Section>

      {/* Bio */}
      <Section icon={BookOpen} title="Bio" accentClass="text-amber-400">
        <FormTextArea label="" name="bio" value={getGameValue("bio")} onChange={handleGameInputChange}
          placeholder="Diamond top main LF consistent duo for climb..." />
      </Section>
    </div>
  );
}

// ── TFT Form ──────────────────────────────────────────────────────────────────

function TftForm({ getGameValue, handleGameInputChange, selectedQueues, toggleQueue }: any) {
  const tftRanks = ["Unranked", "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Challenger"];
  const queues = ["Ranked", "Normal", "Hyper Roll", "Double Up"];
  const currentRank = getGameValue("rank") || "Unranked";

  return (
    <div className="space-y-4">
      {/* Rank — horizontal pill grid */}
      <Section icon={Crown} title="Rank" accentClass="text-blue-400">
        <div className="grid grid-cols-5 gap-2">
          {tftRanks.map((rank) => {
            const on = currentRank === rank;
            return (
              <button key={rank} type="button"
                onClick={() => fireChange(handleGameInputChange, "rank", rank)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  on ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                     : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >{rank}</button>
            );
          })}
        </div>
      </Section>

      {/* Game mode */}
      <Section icon={LayoutGrid} title="Mode" accentClass="text-blue-400">
        <div className="grid grid-cols-2 gap-2">
          {queues.map((q) => (
            <button key={q} type="button" onClick={() => toggleQueue(q)}
              className={`py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >{q}</button>
          ))}
        </div>
      </Section>

      {/* Bio */}
      <Section icon={BookOpen} title="Bio" accentClass="text-blue-400">
        <FormTextArea label="" name="bio" value={getGameValue("bio")} onChange={handleGameInputChange}
          placeholder="Challenger TFT player, love reroll comps and Hyper Roll..." />
      </Section>
    </div>
  );
}

// ── Valorant Form ─────────────────────────────────────────────────────────────

function ValorantForm({ getGameValue, handleGameInputChange, selectedQueues, toggleQueue, selectedAgents, onToggleAgent }: any) {
  const agentRoles = [
    { value: "DUELIST",    label: "Duelist",    icon: Zap,       desc: "Engage & frag" },
    { value: "INITIATOR",  label: "Initiator",  icon: Target,    desc: "Set up plays" },
    { value: "CONTROLLER", label: "Controller", icon: Map,       desc: "Hold space" },
    { value: "SENTINEL",   label: "Sentinel",   icon: Shield,    desc: "Lock down" },
  ];
  const queues = ["Competitive", "Unrated", "Swiftplay", "Spike Rush", "Deathmatch", "Premier"];
  const currentRole = getGameValue("role") || "DUELIST";

  return (
    <div className="space-y-4">
      {/* Riot ID — Valorant has its own account */}
      <Section icon={UserIcon} title="Riot ID" accentClass="text-red-400">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput label="Game Name" icon={UserIcon} name="val_game_name"
            value={getGameValue("game_name")} onChange={handleGameInputChange} placeholder="e.g. Faker" required />
          <FormInput label="Tag" icon={Tag} name="val_tag_line"
            value={getGameValue("tag_line")} onChange={handleGameInputChange} placeholder="TAG" required />
          <FormSelect label="Region" icon={Globe} name="val_region"
            value={getGameValue("region") || "EUW"} onChange={handleGameInputChange}>
            <option value="EUW">Europe West</option>
            <option value="EUNE">Europe NE</option>
            <option value="NA">North America</option>
            <option value="KR">Korea</option>
          </FormSelect>
        </div>
      </Section>

      {/* Rank */}
      <Section icon={Trophy} title="Rank" accentClass="text-red-400">
        <FormSelect label="" icon={Trophy} name="rank"
          value={getGameValue("rank") || "Unranked"} onChange={handleGameInputChange}>
          {VALORANT_RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </FormSelect>
      </Section>

      {/* Agent role — 2×2 visual cards */}
      <Section icon={Crosshair} title="Your role" accentClass="text-red-400">
        <div className="grid grid-cols-2 gap-3">
          {agentRoles.map(({ value, label, icon: RIcon, desc }) => {
            const on = currentRole === value;
            return (
              <button key={value} type="button"
                onClick={() => fireChange(handleGameInputChange, "role", value)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  on ? "bg-red-500/15 border-red-500/40"
                     : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div className={`p-2 rounded-lg ${on ? "bg-red-500/20" : "bg-white/5"}`}>
                  <RIcon size={16} className={on ? "text-red-300" : "text-zinc-500"} />
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-wider ${on ? "text-red-200" : "text-zinc-400"}`}>{label}</p>
                  <p className={`text-[10px] ${on ? "text-red-400" : "text-zinc-600"}`}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Agents */}
      {onToggleAgent && (
        <Section icon={Users} title="Top agents" accentClass="text-red-400"
          trailing={
            selectedAgents.length > 0 ? (
              <span className="text-[9px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                {selectedAgents.length} selected
              </span>
            ) : null
          }
        >
          <div className="flex flex-wrap gap-2">
            {VALORANT_AGENTS.map((agent) => (
              <button key={agent} type="button" onClick={() => onToggleAgent(agent)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedAgents.includes(agent)
                    ? "bg-red-500/15 border-red-500/40 text-red-300"
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >{agent}</button>
            ))}
          </div>
        </Section>
      )}

      {/* Queues */}
      <Section icon={LayoutGrid} title="Modes" accentClass="text-red-400">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {queues.map((q) => (
            <button key={q} type="button" onClick={() => toggleQueue(q)}
              className={`py-3 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-red-500/15 border-red-500/40 text-red-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >{q}</button>
          ))}
        </div>
      </Section>

      {/* Bio */}
      <Section icon={BookOpen} title="Bio" accentClass="text-red-400">
        <FormTextArea label="" name="bio" value={getGameValue("bio")} onChange={handleGameInputChange}
          placeholder="Immortal duelist main, grinding for Radiant. IGL experience..." />
      </Section>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────

const ProfileForm = memo(({
  profile, selectedLangs, onToggleLang, onInputChange, handleGameInputChange,
  toggleQueue, toggleGame, activeTab, enabledGames, selectedQueues,
  selectedAgents = [], onToggleAgent, handleSubmit, onSetActiveTab, loading,
}: ProfileFormProps) => {
  const t = useTranslations();
  const gameKey = activeTab.toLowerCase() as GameKey;

  const getGameValue = (field: string): string => {
    if (!profile) return "";
    switch (field) {
      case "game_name": return getGameName(profile, gameKey);
      case "tag_line":  return getTagLine(profile, gameKey);
      case "region":    return getRegion(profile, gameKey);
      case "bio":       return getBio(profile, gameKey);
      case "main_role":
      case "role":      return getRole(profile, gameKey);
      case "rank":      return getRank(profile, gameKey);
      default:          return getExtra(profile, gameKey, field) ?? "";
    }
  };

  return (
    <section className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={22} className="text-[rgb(var(--accent-color))]" />
        <h3 className="text-2xl font-black uppercase tracking-tighter italic">
          {t("LandingPage.profileEditor.header.title")}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <GlobalSettingsSection
          profile={profile}
          selectedLangs={selectedLangs}
          onToggleLang={onToggleLang}
          onInputChange={onInputChange}
          popularLanguages={POPULAR_LANGUAGES}
        />

        <div className="pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600 mb-3 ml-1">
            Game profile
          </p>
          <GameSelector activeTab={activeTab} enabledGames={enabledGames} onSetActiveTab={onSetActiveTab} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <VisibilityRow activeTab={activeTab} enabledGames={enabledGames} toggleGame={toggleGame} t={t} />

            {activeTab === "LOL" && (
              <LolForm
                profile={profile}
                getGameValue={getGameValue}
                handleGameInputChange={handleGameInputChange}
                selectedQueues={selectedQueues}
                toggleQueue={toggleQueue}
              />
            )}
            {activeTab === "TFT" && (
              <TftForm
                getGameValue={getGameValue}
                handleGameInputChange={handleGameInputChange}
                selectedQueues={selectedQueues}
                toggleQueue={toggleQueue}
              />
            )}
            {activeTab === "VALORANT" && (
              <ValorantForm
                profile={profile}
                getGameValue={getGameValue}
                handleGameInputChange={handleGameInputChange}
                selectedQueues={selectedQueues}
                toggleQueue={toggleQueue}
                selectedAgents={selectedAgents}
                onToggleAgent={onToggleAgent}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pt-4 pb-2 flex justify-end">
          <button
            disabled={loading}
            type="submit"
            className="btn-modern w-full md:w-auto px-10 py-4 bg-[rgb(var(--accent-color))] hover:brightness-110 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="animate-spin" size={18} />{t("ProfilePage.editor.saving")}</>
              : <><Save size={18} />{t("ProfilePage.editor.save")}</>
            }
          </button>
        </div>
      </form>
    </section>
  );
});

export default ProfileForm;