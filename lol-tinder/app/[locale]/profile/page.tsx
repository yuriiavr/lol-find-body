"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  updateProfile,
  getRanksByPuuid,
  getRiotTFTStats,
  getRiotValorantStats,
} from "./actions";
import ProfilePreview from "./components/ProfilePreview";
import ProfileForm from "./components/ProfileForm";
import UnsavedChangesBanner from "./components/UnsavedChangesBanner";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/src/components/ToastProvider";
import { useTranslations } from "next-intl";

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
  const [valStats, setValStats] = useState<any>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [enabledGames, setEnabledGames] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"LOL" | "TFT" | "VALORANT">("LOL");

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
    const prefix =
      activeTab === "LOL"
        ? ""
        : (activeTab === "VALORANT" ? "val" : activeTab.toLowerCase()) + "_";
    return profile[`${prefix}${field}`] ?? "";
  }, [profile, activeTab]);

  useEffect(() => {
    if (!activeTab) return;
    localStorage.setItem("site-game-theme", activeTab);
    document.documentElement.setAttribute(
      "data-game-theme",
      activeTab.toLowerCase(),
    );
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
    activeTab,
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
      const prefix =
        activeTab === "LOL"
          ? ""
          : (activeTab === "VALORANT" ? "val" : activeTab.toLowerCase()) + "_";

      setProfile((prev: any) => {
        const next = { ...prev };
        if (name === "role") next[`${prefix}main_role`] = val;
        else if (name === "bio") next[`${prefix}bio`] = val;
        else if (name === "hasMic") next.has_mic = val;
        else if (name === "isPaused") next.is_paused = val;
        else if (name.endsWith("_gameName")) next[`${prefix}game_name`] = val;
        else if (name.endsWith("_tagLine")) next[`${prefix}tag_line`] = val;
        else if (name.endsWith("_region")) next[`${prefix}region`] = val;
        return next;
      });
    },
    [activeTab],
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
          activeTab === "LOL"
            ? ""
            : (activeTab === "VALORANT" ? "val" : activeTab.toLowerCase()) +
              "_";
        setProfile((p: any) => ({
          ...p,
          [`${prefix}preferred_queue`]: next.join(","),
        }));
        return next;
      });
    },
    [activeTab],
  );

  useEffect(() => {
    if (!profile) return;
    const prefix =
      activeTab === "LOL"
        ? ""
        : (activeTab === "VALORANT" ? "val" : activeTab.toLowerCase()) + "_";
    const queueStr = profile[`${prefix}preferred_queue`] || "";
    setSelectedQueues(queueStr ? queueStr.split(",").filter(Boolean) : []);
  }, [activeTab, !!profile]);

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
        game_name: "",
        tag_line: "",
        region: "EUW",
        main_role: "FILL",
        bio: "",
        tft_game_name: "",
        tft_tag_line: "",
        tft_region: "EUW",
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
        enabled_games: "LOL",
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
          activeTab === "LOL"
            ? ""
            : (activeTab === "VALORANT" ? "val" : activeTab.toLowerCase()) +
              "_";
        const qStr = initialProfile[`${prefix}preferred_queue`] || "";
        setSelectedQueues(qStr.split(",").filter(Boolean));

        if (initialProfile.enabled_games)
          setEnabledGames(initialProfile.enabled_games.split(","));

        // Fetch background stats
        if (initialProfile.puuid) {
          getRanksByPuuid(initialProfile.puuid, initialProfile.region).then(
            (stats) => isMounted && setRiotStats(stats),
          );
        }
        if (initialProfile.tft_puuid) {
          getRiotTFTStats(
            initialProfile.tft_puuid,
            initialProfile.tft_region || initialProfile.region,
          ).then((stats) => isMounted && setTftStats(stats));
        }
        if (initialProfile.val_puuid) {
          // Отримання статистики для Valorant тимчасово вимкнено
          // getRiotValorantStats(
          //   initialProfile.val_puuid,
          //   initialProfile.val_region || initialProfile.region,
          // )
          //   .then((stats) => isMounted && setValStats(stats))
          //   .catch(() => {});
        }
      }

      const savedFormData = localStorage.getItem(
        `profileFormData_${authUser.id}`,
      );
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          if (parsed.activeTab && isMounted) {
            setActiveTab(parsed.activeTab);
          }
        } catch (e) {}
      } else {
        const globalTheme = localStorage.getItem("site-game-theme") as any;
        if (globalTheme) {
          setActiveTab(globalTheme);
        }
      }
      requestAnimationFrame(() => {
        if (isMounted) setIsInitialLoading(false);
      });
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
    formData.append("activeGame", activeTab);
    selectedLangs.forEach((lang) => formData.append("languages", lang));
    selectedQueues.forEach((q) => formData.append("queues", q));
    enabledGames.forEach((g) => formData.append("enabledGames", g));

    const result = await updateProfile(formData);

    if (result?.error) {
      showToast(result.error || t("toasts.error"), "error");
      setLoading(false);
    } else {
      setLastSavedProfile(JSON.parse(JSON.stringify(profile)));
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
            activeTab={activeTab}
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
            activeTab={activeTab}
            enabledGames={enabledGames}
            selectedQueues={selectedQueues}
            handleSubmit={handleSubmit}
            onSetActiveTab={setActiveTab}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
