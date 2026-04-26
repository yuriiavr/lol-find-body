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
  Gamepad2,
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
    handleSubmit,
    onSetActiveTab,
    loading,
  }: ProfileFormProps) => {
    const getGameValue = (field: string) => {
      if (!profile) return "";
      const prefix =
        activeTab === "LOL"
          ? ""
          : (activeTab === "VALORANT" ? "val" : activeTab.toLowerCase()) + "_";
      return profile[`${prefix}${field}`] ?? "";
    };

    return (
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
            label="Post this card?"
            description={`Enable to show your ${activeTab} profile in discovery.`}
            checked={enabledGames.includes(activeTab)}
            onChange={() => toggleGame(activeTab)}
            name="isGameEnabled"
          />

          <div className="flex flex-col md:flex-row gap-6">
            <FormInput
              className="flex-1"
              label="Riot ID (Name)"
              icon={UserIcon}
              name={`${activeTab.toLowerCase()}_gameName`}
              value={getGameValue("game_name")}
              onChange={handleGameInputChange}
              placeholder="e.g. Faker"
              required
            />
            <FormInput
              className="flex-1"
              label="Tagline"
              icon={Tag}
              name={`${activeTab.toLowerCase()}_tagLine`}
              value={getGameValue("tag_line")}
              onChange={handleGameInputChange}
              placeholder="e.g. EUW"
              required
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <FormSelect
              className="flex-1"
              label="Region"
              icon={Globe}
              name={`${activeTab.toLowerCase()}_region`}
              value={getGameValue("region") || "EUW"}
              onChange={handleGameInputChange}
            >
              <option value="EUW">Europe West</option>
              <option value="EUNE">Europe Nordic & East</option>
              <option value="NA">North America</option>
              <option value="KR">Korea</option>
            </FormSelect>
            {activeTab !== "TFT" && (
              <FormSelect
                className="flex-1"
                label="Primary Position"
                icon={Sword}
                name="role"
                value={getGameValue("main_role") || "FILL"}
                onChange={handleGameInputChange}
              >
                {activeTab === "VALORANT" ? (
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
            )}
          </div>

          <BadgeSelector
            label="Preferred Queue"
            icon={LayoutGrid}
            items={QUEUES_BY_GAME[activeTab] || []}
            selectedItems={selectedQueues}
            onToggle={toggleQueue}
          />

          <FormTextArea
            label="Player Biography"
            name="bio"
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
    );
  },
);

export default ProfileForm;
