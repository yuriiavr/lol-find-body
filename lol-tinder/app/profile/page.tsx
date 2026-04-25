"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FormInput, 
  FormSelect, 
  FormSwitch, 
  FormTextArea, 
  BadgeSelector,
  VoiceSwitch 
} from "@/src/components/ui/FormFields";
import { updateProfile } from "./actions";
import { getRiotLeagueStats, getRiotTFTStats, getRiotValorantStats } from "@/app/matches/actions";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  LogOut,
  Sword,
  Globe,
  User as UserIcon,
  Tag,
  Trophy,
  Settings,
  Star,
  Languages,
  LayoutGrid,
  Mic,
  MicOff,
  EyeOff,
  Gamepad2,
  Gamepad,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/src/components/ToastProvider";

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

const GlobalSettingsSection = memo(({ profile, selectedLangs, onToggleLang, onInputChange }: any) => {
  return (
    <div className="modern-panel p-8 mb-10 bg-white/[0.02] border-white/5">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <Settings size={18} className="text-zinc-500" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Global Account Settings</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="md:col-span-2">
          <FormInput
            label="Global Display Name"
            icon={UserIcon}
            name="display_name"
            value={profile?.display_name || ""}
            onChange={onInputChange}
            placeholder="Your social nickname for this app"
            required
          />
        </div>

        <BadgeSelector
          label="Languages you speak"
          icon={Languages}
          items={POPULAR_LANGUAGES}
          selectedItems={selectedLangs}
          onToggle={onToggleLang}
        />

        <div className="space-y-8">
          <VoiceSwitch
            label="Voice Comms"
            icon={Mic}
            checked={profile?.has_mic !== false}
            onChange={onInputChange}
            name="hasMic"
          />
          
        </div>
      </div>
    </div>
  );
});

const QUEUES_BY_GAME: Record<string, string[]> = {
  LOL: ["Solo/Duo", "Flex", "Draft", "ARAM", "Arena", "Quick Play", "Clash"],
  TFT: ["Ranked", "Normal", "Hyper Roll", "Double Up"],
  VALORANT: ["Competitive", "Unrated", "Swiftplay", "Spike Rush", "Deathmatch", "Premier"]
};

const GAMES = [
  { id: 'LOL', name: 'League of Legends', icon: Sword, color: 'orange' },
  { id: 'TFT', name: 'TFT', icon: Gamepad2, color: 'blue' },
  { id: 'VALORANT', name: 'Valorant', icon: Zap, color: 'red' },
];

const supabase = createClient();

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [lastSavedProfile, setLastSavedProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [riotStats, setRiotStats] = useState<any>(null);
  const [tftStats, setTftStats] = useState<any>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [enabledGames, setEnabledGames] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState<'LOL' | 'TFT' | 'VALORANT'>('LOL');

  useEffect(() => {
    if (!profile || !lastSavedProfile || isInitialLoading) {
      setIsDirty(false);
      return;
    }

    const hasChanges = JSON.stringify(profile) !== JSON.stringify(lastSavedProfile);
    setIsDirty(hasChanges);
  }, [profile, lastSavedProfile, isInitialLoading]);

  const getQueueData = (type: string) => {
    return riotStats?.find((s: any) => s.queueType === type);
  };

  const getGameValue = (field: string) => {
    if (!profile) return "";
    const prefix = activeTab === 'LOL' ? '' : (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';
    return profile[`${prefix}${field}`] ?? "";
  };

  useEffect(() => {
    if (!activeTab) return;
    localStorage.setItem('site-game-theme', activeTab);
    document.documentElement.setAttribute('data-game-theme', activeTab.toLowerCase());
  }, [activeTab]);

  useEffect(() => {
    if (!user || isInitialLoading) return;

    const saveTimeout = setTimeout(() => {
      const formDataToSave = {
        profile,
        selectedLangs,
        selectedQueues,
        enabledGames,
        activeTab,
      };

      try {
        localStorage.setItem(`profileFormData_${user.id}`, JSON.stringify(formDataToSave));
      } catch (e) {
      }
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [profile, selectedLangs, selectedQueues, enabledGames, user, isInitialLoading, activeTab]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    
    setProfile((prev: any) => {
      const next = { ...prev };
      if (name === 'hasMic') next.has_mic = val;
      else if (name === 'isPaused') next.is_paused = val;
      else next[name] = val;
      return next;
    });
  }, []);

  const handleGameInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    const prefix = activeTab === 'LOL' ? '' : (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';

    setProfile((prev: any) => {
      const next = { ...prev };
      if (name === 'role') next[`${prefix}main_role`] = val;
      else if (name === 'bio') next[`${prefix}bio`] = val;
      else if (name === 'hasMic') next.has_mic = val;
      else if (name === 'isPaused') next.is_paused = val;
      else if (name.endsWith('_gameName')) next[`${prefix}game_name`] = val;
      else if (name.endsWith('_tagLine')) next[`${prefix}tag_line`] = val;
      else if (name.endsWith('_region')) next[`${prefix}region`] = val;
      return next;
    });
  }, [activeTab]);

  const toggleLang = useCallback((lang: string) => {
    setSelectedLangs((prev) => {
      const next = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang];
      setProfile((p: any) => ({ ...p, language: next.join(',') }));
      return next;
    });
  }, []);

  const toggleQueue = useCallback((queue: string) => {
    setSelectedQueues((prev) => {
      const next = prev.includes(queue) ? prev.filter((q) => q !== queue) : [...prev, queue];
      const prefix = activeTab === 'LOL' ? '' : (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';
      setProfile((p: any) => ({ ...p, [`${prefix}preferred_queue`]: next.join(',') }));
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    if (!profile) return;
    const prefix = activeTab === 'LOL' ? '' : (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';
    const queueStr = profile[`${prefix}preferred_queue`] || "";
    setSelectedQueues(queueStr ? queueStr.split(",").filter(Boolean) : []);
  }, [activeTab, !!profile]);

  const toggleGame = useCallback((game: string) => {
    setEnabledGames((prev) => {
      const next = prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game];
      setProfile((p: any) => ({ ...p, enabled_games: next.join(',') }));
      return next;
    });
  }, []);

  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/");
        return;
      }

      if (!isMounted) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (isMounted) setUser(authUser);

      const defaultProfile = {
        id: authUser.id,
        display_name: "",
        game_name: "", tag_line: "", region: "EUW", main_role: "FILL", bio: "",
        tft_game_name: "", tft_tag_line: "", tft_region: "EUW", tft_main_role: "FILL", tft_bio: "",
        val_game_name: "", val_tag_line: "", val_region: "EUW", val_main_role: "FILL", val_bio: "",
        has_mic: true,
        is_paused: false,
        solo_rank: "Unranked",
        flex_rank: "Unranked",
        tft_rank: "Unranked",
        val_rank: "Unranked",
        enabled_games: "LOL",
        language: "",
        preferred_queue: "",
        tft_preferred_queue: "",
        val_preferred_queue: "",
      };

      const initialProfile = data ? { ...defaultProfile, ...data } : defaultProfile;
      Object.keys(initialProfile).forEach(key => {
        if (initialProfile[key] === null) initialProfile[key] = "";
      });

      if (isMounted) {
        setProfile(initialProfile);
        setLastSavedProfile(JSON.parse(JSON.stringify(initialProfile)));
        if (initialProfile.language) setSelectedLangs(initialProfile.language.split(","));
        
        const prefix = activeTab === 'LOL' ? '' : (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';
        const qStr = initialProfile[`${prefix}preferred_queue`] || "";
        setSelectedQueues(qStr.split(",").filter(Boolean));

        if (initialProfile.enabled_games) setEnabledGames(initialProfile.enabled_games.split(","));
        if (!initialProfile.enabled_games) setEnabledGames(["LOL"]);

        if (initialProfile.puuid) {
          getRiotLeagueStats(initialProfile.puuid, initialProfile.region).then(stats => {
            if (isMounted) setRiotStats(stats);
          });
        }
        if (initialProfile.tft_puuid) {
          getRiotTFTStats(initialProfile.tft_puuid, initialProfile.tft_region || initialProfile.region).then(stats => {
            if (isMounted) setTftStats(stats);
          });
        }
        if (initialProfile.val_puuid) {
          getRiotValorantStats(initialProfile.val_puuid, initialProfile.val_region || initialProfile.region).then(stats => {}).catch(err => {});
        }
      }

      const savedFormData = localStorage.getItem(`profileFormData_${authUser.id}`);
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          if (parsed.activeTab && isMounted) {
            setActiveTab(parsed.activeTab);
          }
        } catch (e) {
        }
      } else {
        const globalTheme = localStorage.getItem('site-game-theme') as any;
        if (globalTheme) {
          setActiveTab(globalTheme);
        }
      }
      requestAnimationFrame(() => {
        if (isMounted) setIsInitialLoading(false);
      });
    };
    getProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("activeGame", activeTab);
    selectedLangs.forEach((lang) => formData.append("languages", lang));
    selectedQueues.forEach((q) => formData.append("queues", q));
    enabledGames.forEach((g) => formData.append("enabledGames", g));

    const result = await updateProfile(formData);

    if (result?.error) {
      showToast(result.error, "error");
      setLoading(false);
    } else {
      const prefix = activeTab === 'LOL' ? '' : (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';
      const formPrefix = (activeTab === 'VALORANT' ? 'val' : activeTab.toLowerCase()) + '_';
      const updatedProfile: any = { ...profile };

      const gameName = formData.get(`${formPrefix}gameName`) as string;
      const tagLine = formData.get(`${formPrefix}tagLine`) as string;
      const region = formData.get(`${formPrefix}region`) as string;
      const role = (formData.get("role") as string) || "FILL";
      const bio = formData.get("bio") as string;

      if (gameName) updatedProfile[`${prefix}game_name`] = gameName;
      if (tagLine) updatedProfile[`${prefix}tag_line`] = tagLine;
      if (region) updatedProfile[`${prefix}region`] = region;
      updatedProfile[`${prefix}main_role`] = role;
      if (bio !== null) updatedProfile[`${prefix}bio`] = bio;

      updatedProfile.display_name = formData.get("display_name") as string;

      updatedProfile[`${prefix}preferred_queue`] = selectedQueues.join(",");
      
      updatedProfile.has_mic = formData.get("hasMic") === "on";
      updatedProfile.language = selectedLangs.join(",");
      updatedProfile.enabled_games = enabledGames.join(",");

      setProfile(updatedProfile);
      setLastSavedProfile(JSON.parse(JSON.stringify(updatedProfile)));
      showToast("Profile updated successfully!", "success");
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const renderRankPanel = (title: string, value: string, isActive: boolean, isMain: boolean = false, stats?: any) => (
    <div className={`modern-panel p-5 transition-all ${isActive ? 'bg-[rgb(var(--accent-color)/0.1)] border-[rgb(var(--accent-color)/0.4)]' : 'bg-white/5 opacity-60'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black uppercase text-slate-500">{title}</span>
        {isMain && <Star size={12} className="text-[rgb(var(--accent-color))]" />}
      </div>
      <p className={`${isMain ? 'text-2xl' : 'text-xl'} font-bold ${isMain ? 'text-white' : 'text-slate-300'} uppercase italic`}>{value || "Unranked"}</p>
      {stats && (stats.wins + stats.losses > 0) && (
        <div className="flex gap-2 mt-1 text-[10px] font-bold">
           <span className="text-emerald-500">
             {Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}% WR
           </span>
           <span className="text-slate-500">({stats.wins + stats.losses} games)</span>
        </div>
      )}
    </div>
  );

  if (isInitialLoading)
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
        <Loader2 className={`animate-spin text-[rgb(var(--accent-color))] w-12 h-12`} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50 flex flex-col">
      {/* Unsaved Changes Banner */}
      <AnimatePresence>
        {isDirty && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-2xl"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-[rgb(var(--accent-color)/0.3)] p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6">
              <div className="flex items-center gap-3 ml-2">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--accent-color))] animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">
                  You have unsaved changes
                </p>
              </div>
              <button 
                onClick={() => (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.click()}
                className="bg-[rgb(var(--accent-color))] hover:brightness-110 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 shadow-lg shadow-[rgb(var(--accent-color)/0.2)]"
              >
                Save Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8 lg:p-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Profile Preview (Left) */}
          <section className="w-full lg:w-96 flex flex-col items-center lg:items-start">
            <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-white/5">
              <div className={`w-2 h-2 rounded-full bg-[rgb(var(--accent-color))]`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{activeTab} PREVIEW</span>
            </div>
            <div className="relative mb-10 group">
              <div className={`w-56 h-56 rounded-[2.5rem] bg-[rgb(var(--accent-color))] p-1 shadow-2xl shadow-[rgb(var(--accent-color)/0.2)] group-hover:rotate-3 transition-transform duration-500`}>
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
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                {profile.display_name || getGameValue('game_name') || "Summoner"}
                <span className="text-slate-600 block text-2xl mt-1">
                  #{getGameValue('tag_line') || "EUW"}
                </span>
              </h1>
              {selectedLangs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 justify-center lg:justify-start">
                  {selectedLangs.map((lang) => (
                    <span
                      key={lang}
                      className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-400 border border-white/5 flex items-center gap-1"
                    >
                      <Languages size={10} className="text-[rgb(var(--accent-color))]" /> {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 w-full space-y-4">
              {activeTab === 'LOL' ? (
                <>
                  {renderRankPanel("Solo Queue", getQueueData('RANKED_SOLO_5x5')?.tier ? `${getQueueData('RANKED_SOLO_5x5').tier} ${getQueueData('RANKED_SOLO_5x5').rank}` : profile.solo_rank, selectedQueues.includes("Solo/Duo"), true, getQueueData('RANKED_SOLO_5x5'))}
                  {renderRankPanel("Flex Queue", getQueueData('RANKED_FLEX_SR')?.tier ? `${getQueueData('RANKED_FLEX_SR').tier} ${getQueueData('RANKED_FLEX_SR').rank}` : profile.flex_rank, selectedQueues.includes("Flex"), false, getQueueData('RANKED_FLEX_SR'))}
                </>
              ) : activeTab === 'TFT' ? (
                renderRankPanel("TFT Ranked", (tftStats && tftStats[0]) ? `${tftStats[0].tier} ${tftStats[0].rank}` : profile.tft_rank, true, true, tftStats?.[0])
              ) : (
                renderRankPanel("VALORANT Rank", profile.val_rank, true, true)
              )}

              <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Position</span>
                <div className="flex items-center gap-2">
                  <Sword size={14} className="text-[rgb(var(--accent-color))]" />
                  <span className="font-bold text-sm uppercase italic">
                    {getGameValue('main_role') || "FILL"}
                  </span>
                </div>
              </div>

              {selectedQueues.some(
                (q) => !["Solo/Duo", "Flex"].includes(q),
              ) && (
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

          {/* Configuration Form (Right) */}
          <section className="flex-1">
            <div className="flex items-center gap-3 mb-10">
              <Settings size={24} className="text-[rgb(var(--accent-color))]" />
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                Profile Editor
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <GlobalSettingsSection 
                profile={profile}
                selectedLangs={selectedLangs}
                onToggleLang={toggleLang}
                onInputChange={handleInputChange}
              />

            <div className="flex border-b border-white/5 mb-8 overflow-x-auto no-scrollbar">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setActiveTab(game.id as any)}
                  className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                    activeTab === game.id 
                    ? `border-[rgb(var(--accent-color))] text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.05)]` 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <game.icon size={14} /> {game.name}
                </button>
              ))}
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormSwitch
                  className="md:col-span-2"
                  label="Post this card?"
                  description={`Enable to show your ${activeTab} profile in discovery.`}
                  checked={enabledGames.includes(activeTab)}
                  onChange={() => toggleGame(activeTab)}
                  name="isGameEnabled"
                />

                <FormInput
                  label="Riot ID (Name)"
                  icon={UserIcon}
                  name={`${activeTab.toLowerCase()}_gameName`}
                  value={getGameValue('game_name')}
                  onChange={handleGameInputChange}
                  placeholder="e.g. Faker"
                  required
                />

                <FormInput
                  label="Tagline"
                  icon={Tag}
                  name={`${activeTab.toLowerCase()}_tagLine`}
                  value={getGameValue('tag_line')}
                  onChange={handleGameInputChange}
                  placeholder="e.g. EUW"
                  required
                />

                <FormSelect
                  label="Region"
                  icon={Globe}
                  name={`${activeTab.toLowerCase()}_region`}
                  value={getGameValue('region') || "EUW"}
                  onChange={handleGameInputChange}
                >
                  <option value="EUW">Europe West</option>
                  <option value="EUNE">Europe Nordic & East</option>
                  <option value="NA">North America</option>
                  <option value="KR">Korea</option>
                </FormSelect>

                <FormSelect
                  label="Primary Position"
                  icon={Sword}
                  name="role"
                  value={getGameValue('main_role') || "FILL"}
                  onChange={handleGameInputChange}
                >
                  {activeTab === 'VALORANT' ? (
                    <>
                      <option value="DUELIST">DUELIST</option>
                      <option value="INITIATOR">INITIATOR</option>
                      <option value="CONTROLLER">CONTROLLER</option>
                      <option value="SENTINEL">SENTINEL</option>
                    </>
                  ) : (
                    <>
                      <option value="FILL">FILL</option>
                      <option value="TOP">TOP</option>
                      <option value="JUNGLE">JUNGLE</option>
                      <option value="MID">MID</option>
                      <option value="ADC">ADC</option>
                      <option value="SUPPORT">SUPPORT</option>
                    </>
                  )}
                </FormSelect>

                <BadgeSelector
                  label="Preferred Queue"
                  icon={LayoutGrid}
                  items={QUEUES_BY_GAME[activeTab] || []}
                  selectedItems={selectedQueues}
                  onToggle={toggleQueue}
                />
              </div>

              <FormTextArea
                label="Player Biography"
                name="bio"
                value={getGameValue('bio')}
                onChange={handleGameInputChange}
                placeholder="Looking for competitive duo..."
              />

              <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <button
                  disabled={loading}
                  type="submit"
                  className={`btn-modern w-full md:w-auto px-12 py-4 bg-[rgb(var(--accent-color))] hover:brightness-110 flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
