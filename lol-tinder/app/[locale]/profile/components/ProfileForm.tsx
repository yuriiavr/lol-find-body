"use client";

import { memo, useState, useRef, useEffect } from "react";
import {
  Settings,
  Gamepad2,
  Sword,
  Zap,
  Save,
  Loader2,
  ChevronRight,
} from "lucide-react";
import GlobalSettingsSection from "./GlobalSettingsSection";
import { LolForm } from "./game-forms/LolForm";
import { TftForm } from "./game-forms/TftForm";
import { ValorantForm } from "./game-forms/ValorantForm";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { FormSwitch } from "@/src/components/ui/FormFields";
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

const POPULAR_LANGUAGES = [
  "Ukrainian",
  "English",
  "Polish",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Romanian",
  "Dutch",
  "Hungarian",
  "Czech",
];

const GAMES = [
  {
    id: "LOL" as const,
    name: "League of Legends",
    shortName: "LoL",
    iconSrc: "/games-icons/lol.png",
    description: "5v5 MOBA",
    iconBg: "linear-gradient(135deg, #c8963e 0%, #f0c070 50%, #a0722a 100%)",
    accent: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      activeBg: "bg-amber-500/15",
      activeBorder: "border-amber-500/40",
      dot: "bg-amber-400",
    },
  },
  {
    id: "TFT" as const,
    name: "Teamfight Tactics",
    shortName: "TFT",
    iconSrc: "/games-icons/tft.png",
    description: "Auto Battler",
    iconBg: "linear-gradient(135deg, #1a5f8c 0%, #4fa8d5 50%, #1a5f8c 100%)",
    accent: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      activeBg: "bg-blue-500/15",
      activeBorder: "border-blue-500/40",
      dot: "bg-blue-400",
    },
  },
  {
    id: "VALORANT" as const,
    name: "Valorant",
    shortName: "VAL",
    iconSrc: "/games-icons/valorant.png",
    description: "5v5 Tactical FPS",
    iconBg: "linear-gradient(135deg, #8b1a1a 0%, #e8453c 50%, #8b1a1a 100%)",
    accent: {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      activeBg: "bg-red-500/15",
      activeBorder: "border-red-500/40",
      dot: "bg-red-400",
    },
  },
];

type NavSection = "global" | "games" | "game-settings";
type GameId = "LOL" | "TFT" | "VALORANT";
function TabSwitcher({
  activeSection,
  onSwitch,
  enabledGames,
}: {
  activeSection: NavSection;
  onSwitch: (section: NavSection) => void;
  enabledGames: string[];
}) {
  const t = useTranslations("ProfilePage.editor.nav");

  const tabs: { id: NavSection; label: string; badge?: number }[] = [
    { id: "global", label: t("global") },
    { id: "games", label: t("games"), badge: enabledGames.length },
    { id: "game-settings", label: t("gameSettings") },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prevTabRef = useRef<NavSection>(activeSection);
  const [bar, setBar] = useState({ left: 0, right: 0 });

  const getEdges = (id: string) => {
    const btn = btnRefs.current[id];
    const con = containerRef.current;
    if (!btn || !con) return null;
    const b = btn.getBoundingClientRect();
    const c = con.getBoundingClientRect();
    return { left: b.left - c.left, right: c.right - b.right };
  };

  useEffect(() => {
    const r = getEdges(activeSection);
    if (r) setBar(r);
  }, []);

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev === activeSection) return;

    const rPrev = getEdges(prev);
    const rNext = getEdges(activeSection);
    if (!rPrev || !rNext) return;

    const tabIds = tabs.map((t) => t.id);
    const goingRight = tabIds.indexOf(activeSection) > tabIds.indexOf(prev);

    if (goingRight) {
      setBar({ left: rPrev.left, right: rNext.right });
    } else {
      setBar({ left: rNext.left, right: rPrev.right });
    }

    const tid = setTimeout(() => {
      const r = getEdges(activeSection);
      if (r) setBar(r);
    }, 130);

    prevTabRef.current = activeSection;
    return () => clearTimeout(tid);
  }, [activeSection]);

  const spring = { type: "spring" as const, stiffness: 460, damping: 36 };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center border-b border-white/[0.06]"
    >
      <motion.span
        className="absolute bottom-0 h-[2px] rounded-full pointer-events-none"
        style={{ background: "rgb(var(--accent-color))" }}
        animate={{ left: bar.left, right: bar.right }}
        transition={spring}
      />

      {tabs.map((tab) => {
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              btnRefs.current[tab.id] = el;
            }}
            type="button"
            onClick={() => {
              if (tab.id !== activeSection) onSwitch(tab.id);
            }}
            className="relative flex items-center gap-2 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[1.4px] transition-colors duration-200 select-none whitespace-nowrap"
            style={{
              color: isActive ? "rgb(var(--accent-color))" : "rgb(90,90,105)",
            }}
          >
            {tab.label}

            {tab.badge != null && tab.badge > 0 && (
              <span
                className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-black px-1"
                style={{
                  background: "rgb(var(--accent-color))",
                  color: "#000",
                }}
              >
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function GamesSection({
  enabledGames,
  toggleGame,
  onGoToGameSettings,
}: {
  enabledGames: string[];
  toggleGame: (game: string) => void;
  onGoToGameSettings: (game: GameId) => void;
}) {
  const t = useTranslations("ProfilePage.editor.gamesSection");

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-5 ml-1">
        {t("title")}
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
        {GAMES.map((game) => {
          const isEnabled = enabledGames.includes(game.id);

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => toggleGame(game.id)}
              className={`
                group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border
                transition-all duration-200 cursor-pointer select-none
                ${
                  isEnabled
                    ? "bg-white/[0.06] border-white/[0.14] opacity-100"
                    : "bg-white/[0.02] border-white/[0.05] opacity-60 grayscale brightness-50 hover:brightness-75 hover:grayscale-[40%] hover:opacity-75"
                }
              `}
              style={{ transform: "translateY(0)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <img
                src={game.iconSrc}
                alt={game.shortName}
                className="w-12 h-12 object-contain drop-shadow-sm"
              />
              <span
                className={`text-[10px] font-bold text-center leading-tight tracking-wide ${isEnabled ? "text-white" : "text-zinc-500"}`}
              >
                {game.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GameTabSwitcher({
  enabledGames,
  activeGame,
  onSelect,
}: {
  enabledGames: string[];
  activeGame: GameId;
  onSelect: (game: GameId) => void;
}) {
  const tabs = GAMES.filter((g) => enabledGames.includes(g.id));

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prevTabRef = useRef<GameId>(activeGame);
  const [bar, setBar] = useState({ left: 0, right: 0 });

  const getEdges = (id: string) => {
    const btn = btnRefs.current[id];
    const con = containerRef.current;
    if (!btn || !con) return null;
    const b = btn.getBoundingClientRect();
    const c = con.getBoundingClientRect();
    return { left: b.left - c.left, right: c.right - b.right };
  };

  useEffect(() => {
    const r = getEdges(activeGame);
    if (r) setBar(r);
  }, [enabledGames.join(",")]);

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev === activeGame) return;

    const rPrev = getEdges(prev);
    const rNext = getEdges(activeGame);
    if (!rPrev || !rNext) return;

    const tabIds = tabs.map((t) => t.id);
    const goingRight = tabIds.indexOf(activeGame) > tabIds.indexOf(prev);

    if (goingRight) {
      setBar({ left: rPrev.left, right: rNext.right });
    } else {
      setBar({ left: rNext.left, right: rPrev.right });
    }

    const tid = setTimeout(() => {
      const r = getEdges(activeGame);
      if (r) setBar(r);
    }, 130);

    prevTabRef.current = activeGame;
    return () => clearTimeout(tid);
  }, [activeGame]);

  const spring = { type: "spring" as const, stiffness: 460, damping: 36 };

  if (tabs.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center border-b border-white/[0.06] mb-6"
    >
      <motion.span
        className="absolute bottom-0 h-[2px] rounded-full pointer-events-none"
        style={{ background: "rgb(var(--accent-color))" }}
        animate={{ left: bar.left, right: bar.right }}
        transition={spring}
      />

      {tabs.map((game) => {
        const isActive = activeGame === game.id;
        return (
          <button
            key={game.id}
            ref={(el) => {
              btnRefs.current[game.id] = el;
            }}
            type="button"
            onClick={() => {
              if (game.id !== activeGame) onSelect(game.id);
            }}
            className="relative flex items-center gap-2 px-5 py-3.5 text-[11px] font-bold uppercase tracking-[1.4px] transition-colors duration-200 select-none"
            style={{
              color: isActive ? "rgb(var(--accent-color))" : "rgb(90,90,105)",
            }}
          >
            <img
              src={game.iconSrc}
              alt={game.shortName}
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            {game.shortName}
          </button>
        );
      })}
    </div>
  );
}

interface ProfileFormProps {
  profile: any;
  selectedLangs: string[];
  onToggleLang: (lang: string) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  handleGameInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  toggleQueue: (queue: string) => void;
  toggleGame: (game: string) => void;
  activeTab: GameId;
  enabledGames: string[];
  selectedQueues: string[];
  selectedAgents?: string[];
  onToggleAgent?: (agent: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onSetActiveTab: (tab: GameId) => void;
  loading: boolean;
  onSectionChange?: (section: NavSection) => void;
}

const ProfileForm = memo(
  ({
    profile,
    selectedLangs,
    onToggleLang,
    onInputChange,
    handleGameInputChange,
    toggleQueue,
    toggleGame,
    activeTab,
    enabledGames,
    selectedQueues,
    selectedAgents = [],
    onToggleAgent,
    handleSubmit,
    onSetActiveTab,
    loading,
    onSectionChange,
  }: ProfileFormProps) => {
    const t = useTranslations();

    const [activeSection, setActiveSection] = useState<NavSection>("global");
    const [prevSection, setPrevSection] = useState<NavSection>("global");

    const sectionOrder: NavSection[] = ["global", "games", "game-settings"];

    const handleSectionChange = (section: NavSection) => {
      setPrevSection(activeSection);
      setActiveSection(section);
      onSectionChange?.(section);
    };

    const direction =
      sectionOrder.indexOf(activeSection) >= sectionOrder.indexOf(prevSection)
        ? 1
        : -1;

    const gameKey = activeTab.toLowerCase() as GameKey;

    const getGameValue = (field: string): string => {
      if (!profile) return "";
      switch (field) {
        case "game_name":
          return getGameName(profile, gameKey);
        case "tag_line":
          return getTagLine(profile, gameKey);
        case "region":
          return getRegion(profile, gameKey);
        case "bio":
          return getBio(profile, gameKey);
        case "main_role":
        case "role":
          return getRole(profile, gameKey);
        case "rank":
          return getRank(profile, gameKey);
        default:
          return getExtra(profile, gameKey, field) ?? "";
      }
    };

    return (
      <section className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={22} className="text-[rgb(var(--accent-color))]" />
          <h3 className="text-2xl font-black uppercase tracking-tighter italic">
            {t("LandingPage.profileEditor.header.title")}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <TabSwitcher
            activeSection={activeSection}
            onSwitch={handleSectionChange}
            enabledGames={enabledGames}
          />

          <div className="mt-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeSection}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {activeSection === "global" && (
                  <GlobalSettingsSection
                    profile={profile}
                    selectedLangs={selectedLangs}
                    onToggleLang={onToggleLang}
                    onInputChange={onInputChange}
                    popularLanguages={POPULAR_LANGUAGES}
                  />
                )}

                {activeSection === "games" && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                    <GamesSection
                      enabledGames={enabledGames}
                      toggleGame={toggleGame}
                      onGoToGameSettings={(game) => {
                        onSetActiveTab(game);
                        handleSectionChange("game-settings");
                      }}
                    />
                  </div>
                )}

                {activeSection === "game-settings" && (
                  <div className="space-y-4">
                    {enabledGames.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl gap-3">
                        <Gamepad2 size={28} className="text-zinc-700" />
                        <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest text-center px-4">
                          {t("ProfilePage.editor.gameSettings.emptyState")}
                        </p>
                      </div>
                    ) : (
                      <>
                        <GameTabSwitcher
                          enabledGames={enabledGames}
                          activeGame={activeTab}
                          onSelect={onSetActiveTab}
                        />

                        <div
                          className={`flex items-center justify-between px-5 py-4 rounded-2xl border mb-2 ${
                            GAMES.find((g) => g.id === activeTab)?.accent
                              .activeBg
                          } ${GAMES.find((g) => g.id === activeTab)?.accent.activeBorder}`}
                        >
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5">
                              {t("ProfilePage.editor.postCard")}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {t("ProfilePage.editor.postCardDesc", {
                                game: activeTab,
                              })}
                            </p>
                          </div>
                          <FormSwitch
                            label=""
                            checked={enabledGames.includes(activeTab)}
                            onChange={() => toggleGame(activeTab)}
                            name="isGameEnabled"
                          />
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            {activeTab === "LOL" && (
                              <LolForm
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
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pt-6 pb-2 flex justify-end">
            <button
              disabled={loading}
              type="submit"
              className="btn-modern w-full md:w-auto px-10 py-4 bg-[rgb(var(--accent-color))] hover:brightness-110 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {t("ProfilePage.editor.saving")}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t("ProfilePage.editor.save")}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    );
  },
);

export default ProfileForm;
