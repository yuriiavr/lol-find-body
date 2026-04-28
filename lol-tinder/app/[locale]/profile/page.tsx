"use client";

import { useState, useEffect, memo, useCallback, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  updateProfile,
  getRanksByPuuidAction,
  getRiotTFTStatsAction,
} from "./actions";
import ProfilePreview from "./components/ProfilePreview";
import ProfileForm from "./components/ProfileForm";
import UnsavedChangesBanner from "./components/UnsavedChangesBanner";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/src/components/ToastProvider";
import { useTranslations } from "next-intl";
import { useGameTheme, type GameType } from "@/src/context/GameThemeContext";

const supabase = createClient();

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { activeGame, setActiveGame } = useGameTheme();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [lastSavedProfile, setLastSavedProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [riotStats, setRiotStats] = useState<any>(null);
  const [tftStats, setTftStats] = useState<any>(null);
  const [valStats, setValStats] = useState<any>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [enabledGames, setEnabledGames] = useState<string[]>([]);

  const t = useTranslations("ProfilePage.editor");

  useEffect(() => {
    if (!profile || !lastSavedProfile || isInitialLoading) {
      setIsDirty(false);
      return;
    }

    const hasChanges =
      JSON.stringify(profile) !== JSON.stringify(lastSavedProfile);
    setIsDirty(hasChanges);
  }, [profile, lastSavedProfile, isInitialLoading]);

  const getGameValue = useCallback((field: string) => {
    if (!profile) return "";

    // Mapping for LOL/TFT which use the global Riot Account columns
    if (activeGame === "lol" || activeGame === "tft") {
      if (field === "game_name") return profile.riot_game_name ?? "";
      if (field === "tag_line") return profile.riot_tag_line ?? "";
      if (field === "region") return profile.riot_region ?? "";
    }

    const prefix =
      activeGame === "lol"
        ? ""
        : (activeGame === "valorant" ? "val" : activeGame) + "_";
    return profile[`${prefix}${field}`] ?? "";
  }, [profile, activeGame]);

  useEffect(() => {
    if (!user || isInitialLoading) return;

    const saveTimeout = setTimeout(() => {
      const formDataToSave = {
        profile,
        selectedLangs,
        selectedQueues,
        enabledGames,
        activeGame,
      };

      try {
        localStorage.setItem(
          `profileFormData_${user.id}`,
          JSON.stringify(formDataToSave),
        );
      } catch (e) {}
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [
    profile,
    selectedLangs,
    selectedQueues,
    enabledGames,
    user,
    isInitialLoading,
    activeGame,
  ]);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === "checkbox";
      const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;

      setProfile((prev: any) => {
        const next = { ...prev };
        if (name === "hasMic") next.has_mic = val;
        else if (name === "isPaused") next.is_paused = val;
        else next[name] = val;
        return next;
      });
    },
    [],
  );

  const handleGameInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === "checkbox";
      const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;

      setProfile((prev: any) => ({
        ...prev,
        [name]: val
      }));
    },
    [],
  );

  const toggleLang = useCallback((lang: string) => {
    setSelectedLangs((prev) => {
      const next = prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang];
      setProfile((p: any) => ({ ...p, language: next.join(",") }));
      return next;
    });
  }, []);

  const toggleQueue = useCallback(
    (queue: string) => {
      setSelectedQueues((prev) => {
        const next = prev.includes(queue)
          ? prev.filter((q) => q !== queue)
          : [...prev, queue];
        const prefix =
          activeGame === "lol"
            ? ""
            : (activeGame === "valorant" ? "val" : activeGame) +
              "_";
        setProfile((p: any) => ({
          ...p,
          [`${prefix}preferred_queue`]: next.join(","),
        }));
        return next;
      });
    },
    [activeGame],
  );

  const toggleAgent = useCallback((agent: string) => {
    setSelectedAgents((prev) => {
      const next = prev.includes(agent)
        ? prev.filter((a) => a !== agent)
        : [...prev, agent];
      
      setProfile((p: any) => ({ ...p, val_top_agents: next.join(",") }));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const prefix =
      activeGame === "lol"
        ? ""
        : (activeGame === "valorant" ? "val" : activeGame) + "_";
    const queueStr = profile[`${prefix}preferred_queue`] || "";
    setSelectedQueues(queueStr ? queueStr.split(",").filter(Boolean) : []);
  }, [activeGame, !!profile]);

  useEffect(() => {
    if (!profile?.val_top_agents) { setSelectedAgents([]); return; }
    setSelectedAgents(profile.val_top_agents.split(",").filter(Boolean));
  }, [activeGame, profile?.val_top_agents]);

  const toggleGame = useCallback((game: string) => {
    setEnabledGames((prev) => {
      const next = prev.includes(game)
        ? prev.filter((g) => g !== game)
        : [...prev, game];
      setProfile((p: any) => ({ ...p, enabled_games: next.join(",") }));
      return next;
    });
  }, []);

  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const getProfile = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

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
      if (!isMounted) return;

      const defaultProfile = {
        id: authUser.id,
        display_name: "",
        riot_game_name: "",
        riot_tag_line: "",
        riot_region: "EUW",
        main_role: "FILL",
        bio: "",
        tft_main_role: "FILL",
        tft_bio: "",
        val_game_name: "",
        val_tag_line: "",
        val_region: "EUW",
        val_main_role: "FILL",
        val_bio: "",
        has_mic: true,
        is_paused: false,
        solo_rank: "Unranked",
        flex_rank: "Unranked",
        tft_rank: "Unranked",
        val_rank: "Unranked",
        solo_wins: 0,
        solo_losses: 0,
        flex_wins: 0,
        flex_losses: 0,
        tft_wins: 0,
        tft_losses: 0,
        val_wins: 0,
        val_losses: 0,
        enabled_games: "LOL",
        val_top_agents: "",
        language: "",
        preferred_queue: "",
        tft_preferred_queue: "",
        val_preferred_queue: "",
      };

      const initialProfile = data
        ? { ...defaultProfile, ...data }
        : defaultProfile;
      Object.keys(initialProfile).forEach((key) => {
        if (initialProfile[key] === null) initialProfile[key] = "";
      });

      if (isMounted) {
        setProfile(initialProfile);
        setLastSavedProfile(JSON.parse(JSON.stringify(initialProfile)));
        if (initialProfile.language)
          setSelectedLangs(initialProfile.language.split(","));

        const prefix =
          activeGame === "lol"
            ? ""
            : (activeGame === "valorant" ? "val" : activeGame) +
              "_";
        const qStr = initialProfile[`${prefix}preferred_queue`] || "";
        setSelectedQueues(qStr.split(",").filter(Boolean));

        if (initialProfile.val_top_agents)
          setSelectedAgents(initialProfile.val_top_agents.split(","));

        if (initialProfile.enabled_games)
          setEnabledGames(initialProfile.enabled_games.split(","));

        if (initialProfile.puuid) {
          getRanksByPuuidAction(initialProfile.puuid, initialProfile.riot_region).then(
            (stats) => isMounted && setRiotStats(stats),
          );
        }

        const initialGames = initialProfile.enabled_games ? initialProfile.enabled_games.split(",") : [];
        if (initialProfile.puuid && (initialGames.includes("TFT") || activeGame === "tft")) {
          getRiotTFTStatsAction(
            initialProfile.puuid,
            initialProfile.riot_region,
          ).then((stats) => isMounted && setTftStats(stats));
        }
      }

      if (isMounted) setIsInitialLoading(false);
    };
    getProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const gamePrefix = activeGame === "lol" ? "" : (activeGame === "valorant" ? "val_" : "tft_");

    formData.append("activeGame", activeGame.toUpperCase());
    formData.set("language", selectedLangs.join(","));
    formData.set(`${gamePrefix}preferred_queue`, selectedQueues.join(","));
    if (activeGame === "valorant") formData.set("val_top_agents", selectedAgents.join(","));
    formData.set("enabled_games", enabledGames.join(","));

    // Ensure shared Riot Account data is passed
    formData.set("riot_game_name", profile.riot_game_name || "");
    formData.set("riot_tag_line", profile.riot_tag_line || "");
    formData.set("riot_region", profile.riot_region || "EUW");

    const result = await updateProfile(formData);

    if (result?.error) {
      showToast(result.error || t("toasts.error"), "error");
      setLoading(false);
    } else {
      // Якщо повернуто новий puuid, оновлюємо статистику для RankPanel
      if (result.puuid) {
        const region = (formData.get('riot_region') as string) || profile.riot_region;
        
        // Запускаємо оновлення статистики паралельно
        const [stats, tft] = await Promise.all([
          getRanksByPuuidAction(result.puuid, region),
          getRiotTFTStatsAction(result.puuid, region)
        ]);

        setRiotStats(stats);
        setTftStats(tft);

        // Синхронізуємо локальний стан профілю з новим PUUID
        setProfile((prev: any) => {
          const updated = { ...prev, puuid: result.puuid };
          setLastSavedProfile(JSON.parse(JSON.stringify(updated)));
          return updated;
        });
      } else {
        setLastSavedProfile(JSON.parse(JSON.stringify(profile)));
      }

      showToast(t("toasts.success"), "success");
      setLoading(false);
    }
  }

  if (isInitialLoading)
    return (
      <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
        <Loader2
          className={`animate-spin text-[rgb(var(--accent-color))] w-12 h-12`}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50 flex flex-col">
      <UnsavedChangesBanner
        isDirty={isDirty}
        onSave={() =>
          (
            document.querySelector('button[type="submit"]') as HTMLButtonElement
          )?.click()
        }
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8 lg:p-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <ProfilePreview
            profile={profile}
            user={user}
            selectedLangs={selectedLangs}
            activeTab={activeGame.toUpperCase() as any}
            riotStats={riotStats}
            tftStats={tftStats}
            valStats={valStats}
            selectedQueues={selectedQueues}
            getGameValue={getGameValue}
          />

          <ProfileForm
            profile={profile}
            selectedLangs={selectedLangs}
            onToggleLang={toggleLang}
            onInputChange={handleInputChange}
            handleGameInputChange={handleGameInputChange}
            toggleQueue={toggleQueue}
            toggleGame={toggleGame}
            selectedAgents={selectedAgents}
            onToggleAgent={toggleAgent}
            activeTab={activeGame.toUpperCase() as any}
            enabledGames={enabledGames}
            selectedQueues={selectedQueues}
            handleSubmit={handleSubmit}
            onSetActiveTab={(tab) => setActiveGame(tab.toLowerCase() as GameType)}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
