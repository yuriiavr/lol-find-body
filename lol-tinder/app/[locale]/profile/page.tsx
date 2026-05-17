"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  updateProfile,
  getRanksByPuuidAction,
  getRiotTFTStatsAction,
  OtherGameEntry,
} from "./actions";
import GlobalPreview from "./components/GlobalPreview";
import ProfileForm from "./components/ProfileForm";
import UnsavedChangesBanner from "./components/UnsavedChangesBanner";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/src/components/ToastProvider";
import { useTranslations } from "next-intl";
import { useGameTheme, type GameType } from "@/src/context/GameThemeContext";
import {
  getGameName,
  getTagLine,
  getRegion,
  getRank,
  getBio,
  getRole,
  getExtra,
  buildGameUpdate,
  isGameAccountReady,
  type GameKey,
} from "@/src/lib/profile";

const supabase = createClient();

type NavSection = "global" | "games" | "game-settings";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { activeGame, setActiveGame, setEnabledGamesCtx } = useGameTheme();
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
  const [visibleGames, setVisibleGames] = useState<string[]>([]);
  const otherGames: OtherGameEntry[] = profile?.game_profiles?.other ?? [];
  const setOtherGames = useCallback((entries: OtherGameEntry[]) => {
    setProfile((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        game_profiles: { ...prev.game_profiles, other: entries },
      };
    });
  }, []);

  const [activeSection, setActiveSection] = useState<NavSection>("global");

  const t = useTranslations("ProfilePage.editor");

  useEffect(() => {
    if (!profile || !lastSavedProfile || isInitialLoading) {
      setIsDirty(false);
      return;
    }
    setIsDirty(JSON.stringify(profile) !== JSON.stringify(lastSavedProfile));
  }, [profile, lastSavedProfile, isInitialLoading]);

  useEffect(() => {
    setEnabledGamesCtx(enabledGames);
  }, [enabledGames, setEnabledGamesCtx]);

  const getGameValue = useCallback(
    (field: string) => {
      if (!profile) return "";
      const game = activeGame.toLowerCase() as GameKey;
      switch (field) {
        case "game_name":
          return getGameName(profile, game);
        case "tag_line":
          return getTagLine(profile, game);
        case "region":
          return getRegion(profile, game);
        case "bio":
          return getBio(profile, game);
        case "main_role":
        case "role":
          return getRole(profile, game);
        case "rank":
          return getRank(profile, game);
        // friend_code зберігається на top-level profile
        case "friend_code":
          return (profile?.friend_code as string) ?? "";
        default:
          return getExtra(profile, game, field) ?? "";
      }
    },
    [profile, activeGame],
  );

  useEffect(() => {
    if (!user || isInitialLoading) return;
    const saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(
          `profileFormData_${user.id}`,
          JSON.stringify({
            profile,
            selectedLangs,
            selectedQueues,
            enabledGames,
            activeGame,
          }),
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

        if (name === "hasMic") {
          next.has_mic = val;
        } else if (name === "isPaused") {
          next.is_paused = val;
        } else if (name === "riot_game_name") {
          next.game_profiles = {
            ...prev?.game_profiles,
            lol: { ...prev?.game_profiles?.lol, game_name: val },
            tft: { ...prev?.game_profiles?.tft, game_name: val },
          };
        } else if (name === "riot_tag_line") {
          next.game_profiles = {
            ...prev?.game_profiles,
            lol: { ...prev?.game_profiles?.lol, tag_line: val },
            tft: { ...prev?.game_profiles?.tft, tag_line: val },
          };
        } else if (name === "riot_region") {
          next.game_profiles = {
            ...prev?.game_profiles,
            lol: { ...prev?.game_profiles?.lol, region: val },
            tft: { ...prev?.game_profiles?.tft, region: val },
          };
        } else {
          next[name] = val;
        }

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

      setProfile((prev: any) => {
        const gameKey = activeGame.toLowerCase() as GameKey;
        const stateKey = name.replace(/^val_/, "").replace(/^tft_/, "");

        // friend_code зберігається на top-level, не в game_profiles
        if (stateKey === "friend_code") {
          return { ...prev, friend_code: val };
        }

        const existingGameProfile = prev?.game_profiles?.[gameKey] ?? {};
        return {
          ...prev,
          game_profiles: {
            ...prev?.game_profiles,
            [gameKey]: { ...existingGameProfile, [stateKey]: val },
          },
        };
      });
    },
    [activeGame],
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
        setProfile((p: any) => ({
          ...p,
          game_profiles: {
            ...p?.game_profiles,
            [activeGame.toLowerCase()]: {
              ...p?.game_profiles?.[activeGame.toLowerCase()],
              queues: next.join(","),
            },
          },
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
      setProfile((p: any) => ({
        ...p,
        game_profiles: {
          ...p?.game_profiles,
          valorant: { ...p?.game_profiles?.valorant, agents: next.join(",") },
        },
      }));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const queueStr =
      getExtra(profile, activeGame.toLowerCase() as GameKey, "queues") || "";
    setSelectedQueues(queueStr ? queueStr.split(",").filter(Boolean) : []);
  }, [activeGame, profile?.game_profiles]);

  useEffect(() => {
    const agentStr = getExtra(profile, "valorant", "agents") || "";
    setSelectedAgents(agentStr ? agentStr.split(",").filter(Boolean) : []);
  }, [profile?.game_profiles]);

  // Re-fetch TFT stats when user switches to TFT tab or enables TFT after
  // initial load (initial-mount fetch covers only the load-time state).
  useEffect(() => {
    if (isInitialLoading || !profile) return;
    const wantsTft = activeGame === "tft" || enabledGames.includes("TFT");
    if (!wantsTft || tftStats) return;

    const tftPuuid = getExtra(profile, "tft", "puuid");
    if (!tftPuuid) return;

    const region = getRegion(profile, "tft") || getRegion(profile, "lol");
    let cancelled = false;
    getRiotTFTStatsAction(tftPuuid, region).then(
      (stats) => !cancelled && setTftStats(stats),
    );
    return () => {
      cancelled = true;
    };
  }, [activeGame, enabledGames, profile?.game_profiles, isInitialLoading]);

  const toggleGame = useCallback(
    (game: string) => {
      setEnabledGames((prev) => {
        const next = prev.includes(game)
          ? prev.filter((g) => g !== game)
          : [...prev, game];
        setProfile((p: any) => ({ ...p, enabled_games: next.join(",") }));

        const isRemoving = prev.includes(game);
        const isFirst = !prev.includes(game) && prev.length === 0;

        if (isRemoving && activeGame.toLowerCase() === game.toLowerCase()) {
          const remaining = next.filter(
            (g) => g.toLowerCase() !== game.toLowerCase(),
          );
          queueMicrotask(() =>
            setActiveGame(
              remaining.length > 0
                ? (remaining[0].toLowerCase() as any)
                : "none",
            ),
          );
        } else if (isFirst) {
          queueMicrotask(() => setActiveGame(game.toLowerCase() as any));
        }

        return next;
      });
    },
    [activeGame, setActiveGame],
  );

  const toggleVisibility = useCallback((game: string) => {
    setVisibleGames((prev) => {
      const isEnabling = !prev.includes(game);
      if (isEnabling && !isGameAccountReady(profile, game)) return prev;
      const next = isEnabling
        ? [...prev, game]
        : prev.filter((g) => g !== game);
      setProfile((p: any) => ({ ...p, visible_games: next.join(",") }));
      return next;
    });
  }, [profile]);

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

      const { data } = await supabase
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
        enabled_games: "",
        language: "",
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

        const qStr =
          getExtra(
            initialProfile,
            activeGame.toLowerCase() as GameKey,
            "queues",
          ) || "";
        setSelectedQueues(qStr ? qStr.split(",").filter(Boolean) : []);

        const agentsStr = getExtra(initialProfile, "valorant", "agents") || "";
        if (agentsStr) setSelectedAgents(agentsStr.split(",").filter(Boolean));

        if (initialProfile.enabled_games)
          setEnabledGames(initialProfile.enabled_games.split(","));
        if (initialProfile.visible_games)
          setVisibleGames(initialProfile.visible_games.split(","));

        const lolPuuid = getExtra(initialProfile, "lol", "puuid");
        const lolRegion = getRegion(initialProfile, "lol");
        if (lolPuuid) {
          getRanksByPuuidAction(lolPuuid, lolRegion).then(
            (stats) => isMounted && setRiotStats(stats),
          );
        }

        const initialGames = initialProfile.enabled_games
          ? initialProfile.enabled_games.split(",")
          : [];
        // PUUID per-key encrypted → не фолбечимо на lol.puuid для TFT.
        const tftPuuid = getExtra(initialProfile, "tft", "puuid");
        if (
          tftPuuid &&
          (initialGames.includes("TFT") || activeGame === "tft")
        ) {
          getRiotTFTStatsAction(
            tftPuuid,
            getRegion(initialProfile, "tft") || lolRegion,
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
    const gameKey = activeGame.toLowerCase() as GameKey;

    formData.append("activeGame", activeGame.toUpperCase());
    formData.set("language", selectedLangs.join(","));
    formData.set("enabled_games", enabledGames.join(","));
    formData.set("visible_games", visibleGames.join(","));
    formData.set("has_mic", String(profile.has_mic ?? true));
    formData.set("role", getRole(profile, gameKey) || "");
    formData.set("bio", getBio(profile, gameKey) || "");
    formData.set("queues", selectedQueues.join(","));

    if (activeGame.toUpperCase() === "VALORANT") {
      formData.set("rank", getRank(profile, "valorant") || "Unranked");
      formData.set("agents", selectedAgents.join(","));
    }
    // TFT rank is fetched from Riot API server-side — no client value sent.
    if (activeGame.toUpperCase() === "CS2") {
      formData.set("rank", getRank(profile, "cs2") || "Unranked");
      formData.set("friend_code", (profile?.friend_code as string) ?? "");
      formData.set("region", getRegion(profile, "cs2") || "EU");
    }

    console.log('[client] saving profile, otherGames=', otherGames);
    const result = await updateProfile(formData, otherGames);
    console.log('[client] updateProfile result:', result);

    if (result?.error) {
      showToast(result.error || t("toasts.error"), "error");
      setLoading(false);
    } else {
      if (result.puuid) {
        const region =
          (formData.get("riot_region") as string) || getRegion(profile, "lol");
        const [stats, tft] = await Promise.all([
          getRanksByPuuidAction(result.puuid, region),
          getRiotTFTStatsAction(result.puuid, region),
        ]);
        setRiotStats(stats);
        setTftStats(tft);
        setProfile((prev: any) => {
          const updated = buildGameUpdate(prev, "lol", { puuid: result.puuid });
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
        <Loader2 className="animate-spin text-[rgb(var(--accent-color))] w-12 h-12" />
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
          <GlobalPreview
            profile={profile}
            user={user}
            selectedLangs={selectedLangs}
            enabledGames={enabledGames}
          />

          <ProfileForm
            profile={profile}
            selectedLangs={selectedLangs}
            onToggleLang={toggleLang}
            onInputChange={handleInputChange}
            handleGameInputChange={handleGameInputChange}
            toggleQueue={toggleQueue}
            toggleGame={toggleGame}
            visibleGames={visibleGames}
            toggleVisibility={toggleVisibility}
            selectedAgents={selectedAgents}
            onToggleAgent={toggleAgent}
            activeTab={activeGame.toUpperCase() as any}
            enabledGames={enabledGames}
            selectedQueues={selectedQueues}
            handleSubmit={handleSubmit}
            onSetActiveTab={(tab) =>
              setActiveGame(tab.toLowerCase() as GameType)
            }
            loading={loading}
            onSectionChange={setActiveSection}
            otherGames={otherGames}
            onOtherGamesChange={setOtherGames}
          />
        </div>
      </main>
    </div>
  );
}
