import { memo } from "react";
import {
  Settings,
  User as UserIcon,
  Tag,
  Globe,
  Sword,
  LayoutGrid,
  Loader2,
  Save,
  Link as LinkIcon,
  Gamepad2,
  Trophy,
  Zap,
} from "lucide-react";
import {
  FormInput,
  FormSelect,
  FormSwitch,
  FormTextArea,
  BadgeSelector,
} from "@/src/components/ui/FormFields";
import GlobalSettingsSection from "./GlobalSettingsSection";
import { useTranslations } from "next-intl";

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

const VALORANT_RANKS = [
  "Unranked",
  "Iron 1",
  "Iron 2",
  "Iron 3",
  "Bronze 1",
  "Bronze 2",
  "Bronze 3",
  "Silver 1",
  "Silver 2",
  "Silver 3",
  "Gold 1",
  "Gold 2",
  "Gold 3",
  "Platinum 1",
  "Platinum 2",
  "Platinum 3",
  "Diamond 1",
  "Diamond 2",
  "Diamond 3",
  "Ascendant 1",
  "Ascendant 2",
  "Ascendant 3",
  "Immortal 1",
  "Immortal 2",
  "Immortal 3",
  "Radiant",
];

const VALORANT_AGENTS = [
  "Astra",
  "Breach",
  "Brimstone",
  "Chamber",
  "Clove",
  "Cypher",
  "Deadlock",
  "Fade",
  "Gekko",
  "Harbor",
  "Iso",
  "Jett",
  "KAY/O",
  "Killjoy",
  "Neon",
  "Omen",
  "Phoenix",
  "Raze",
  "Reyna",
  "Sage",
  "Skye",
  "Sova",
  "Viper",
  "Vyse",
  "Yoru",
];

const QUEUES_BY_GAME: Record<string, string[]> = {
  LOL: ["Solo/Duo", "Flex", "Draft", "ARAM", "Arena", "Quick Play", "Clash"],
  TFT: ["Ranked", "Normal", "Hyper Roll", "Double Up"],
  VALORANT: [
    "Competitive",
    "Unrated",
    "Swiftplay",
    "Spike Rush",
    "Deathmatch",
    "Premier",
  ],
};

const GAMES = [
  { id: "LOL", name: "League of Legends", icon: Sword, color: "orange" },
  { id: "TFT", name: "TFT", icon: Gamepad2, color: "blue" },
  { id: "VALORANT", name: "Valorant", icon: Zap, color: "red" },
];

interface ProfileFormProps {
  profile: any;
  selectedLangs: string[];
  onToggleLang: (lang: string) => void;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleGameInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
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
  }: ProfileFormProps) => {
    const t = useTranslations();

    const prefix =
      activeTab === "LOL" ? "" : activeTab === "VALORANT" ? "val_" : "tft_";

    const getGameValue = (field: string) => {
      if (!profile) return "";
      return profile[`${prefix}${field}`] ?? "";
    };

    return (
      <section className="flex-1">
        <div className="flex items-center gap-3 mb-10">
          <Settings size={24} className="text-[rgb(var(--accent-color))]" />
          <h3 className="text-2xl font-black uppercase tracking-tighter italic">
            {t("LandingPage.profileEditor.header.title")}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <GlobalSettingsSection
            profile={profile}
            selectedLangs={selectedLangs}
            onToggleLang={onToggleLang}
            onInputChange={onInputChange}
            popularLanguages={POPULAR_LANGUAGES}
          />

          <div className="flex border-b border-white/5 mb-8 overflow-x-auto no-scrollbar">
            {GAMES.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => onSetActiveTab(game.id as any)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === game.id
                    ? `border-[rgb(var(--accent-color))] text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.05)]`
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <game.icon size={14} /> {game.name}
              </button>
            ))}
          </div>

          <FormSwitch
            className="md:col-span-2"
            label={t("ProfilePage.editor.postCard")}
            description={t("ProfilePage.editor.postCardDesc", {
              game: activeTab,
            })}
            checked={enabledGames.includes(activeTab)}
            onChange={() => toggleGame(activeTab)}
            name="isGameEnabled"
          />

          {activeTab === "VALORANT" && (
            <div className="flex flex-col md:flex-row gap-6">
              <FormInput
                className="flex-1"
                label={t("ProfilePage.editor.riotId")}
                icon={UserIcon}
                name={`${prefix}game_name`}
                value={getGameValue("game_name")}
                onChange={handleGameInputChange}
                placeholder="e.g. Faker"
                required
              />
              <FormInput
                className="flex-1"
                label={t("ProfilePage.editor.tagline")}
                icon={Tag}
                name={`${prefix}tag_line`}
                value={getGameValue("tag_line")}
                onChange={handleGameInputChange}
                placeholder="e.g. EUW"
                required
              />
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {activeTab === "VALORANT" && (
              <FormSelect
                className="flex-1"
                label={t("LandingPage.discovery.filters.region.label")}
                icon={Globe}
                name={`${prefix}region`}
                value={getGameValue("region") || "EUW"}
                onChange={handleGameInputChange}
              >
                <option value="EUW">{t("Common.regions.EUW")}</option>
                <option value="EUNE">{t("Common.regions.EUNE")}</option>
                <option value="NA">{t("Common.regions.NA")}</option>
                <option value="KR">{t("Common.regions.KR")}</option>
              </FormSelect>
            )}
            {activeTab === "VALORANT" && (
              <FormSelect
                className="flex-1"
                label={t("ProfilePage.editor.rank")}
                icon={Trophy}
                name={`${prefix}rank`}
                value={getGameValue("rank") || "Unranked"}
                onChange={handleGameInputChange}
              >
                {VALORANT_RANKS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </FormSelect>
            )}
            {activeTab !== "TFT" && (
              <FormSelect
                className="flex-1"
                label={t("LandingPage.discovery.filters.role.label")}
                icon={Sword}
                name={`${prefix}main_role`}
                value={getGameValue("main_role") || "FILL"}
                onChange={handleGameInputChange}
              >
                {activeTab === "VALORANT" ? (
                  <>
                    <option value="DUELIST">{t("Common.roles.duelist")}</option>
                    <option value="INITIATOR">
                      {t("Common.roles.initiator")}
                    </option>
                    <option value="CONTROLLER">
                      {t("Common.roles.controller")}
                    </option>
                    <option value="SENTINEL">
                      {t("Common.roles.sentinel")}
                    </option>
                  </>
                ) : (
                  <>
                    <option value="FILL">{t("Common.roles.fill")}</option>
                    <option value="TOP">{t("Common.roles.top")}</option>
                    <option value="JUNGLE">{t("Common.roles.jungle")}</option>
                    <option value="MID">{t("Common.roles.mid")}</option>
                    <option value="ADC">{t("Common.roles.adc")}</option>
                    <option value="SUPPORT">{t("Common.roles.support")}</option>
                  </>
                )}
              </FormSelect>
            )}
          </div>

          <BadgeSelector
            label={t("LandingPage.discovery.filters.queue.label")}
            icon={LayoutGrid}
            items={QUEUES_BY_GAME[activeTab] || []}
            selectedItems={selectedQueues}
            onToggle={toggleQueue}
          />

          {activeTab === "VALORANT" && onToggleAgent && (
            <BadgeSelector
              label={t("ProfilePage.editor.agents")}
              icon={UserIcon}
              items={VALORANT_AGENTS}
              selectedItems={selectedAgents}
              onToggle={onToggleAgent}
            />
          )}

          <FormTextArea
            label={t("ProfilePage.editor.bio")}
            name={`${prefix}bio`}
            value={getGameValue("bio")}
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
                  {t("ProfilePage.editor.saving")}
                </>
              ) : (
                <>
                  <Save size={20} />
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
