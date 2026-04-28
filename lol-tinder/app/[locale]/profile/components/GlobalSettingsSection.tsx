import { memo, useState } from "react";
import { Settings, User as UserIcon, Languages, Mic, Hash, Globe, ChevronDown } from "lucide-react";
import { FormInput, BadgeSelector, VoiceSwitch } from "@/src/components/ui/FormFields";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface GlobalSettingsSectionProps {
  profile: any;
  selectedLangs: string[];
  onToggleLang: (lang: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  popularLanguages: string[];
}

const GlobalSettingsSection = memo(({ profile, selectedLangs, onToggleLang, onInputChange, popularLanguages }: GlobalSettingsSectionProps) => {
  const t = useTranslations();
  const [isRiotOpen, setIsRiotOpen] = useState(false);

  return (
    <div className="modern-panel p-8 mb-10 bg-white/[0.02] border-white/5">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <Settings size={18} className="text-zinc-500" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{t('LandingPage.profileEditor.settings.title')}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="md:col-span-2">
          <FormInput
            label={t('LandingPage.profileEditor.settings.displayName.label')}
            icon={UserIcon}
            name="display_name"
            value={profile?.display_name || ""}
            onChange={onInputChange}
            placeholder={t('ProfilePage.editor.placeholderName')}
            required
          />
        </div>

        <BadgeSelector
          label={t('LandingPage.profileEditor.settings.languages.label')}
          icon={Languages}
          items={popularLanguages}
          selectedItems={selectedLangs}
          onToggle={onToggleLang}
        />

        <div className="space-y-8">
          <VoiceSwitch
            label={t('LandingPage.profileEditor.settings.voice.label')}
            icon={Mic}
            checked={profile?.has_mic !== false}
            onChange={onInputChange}
            name="hasMic"
          />
        </div>

        {/* Riot Account Section */}
        <div className="md:col-span-2 mt-4 pt-8 border-t border-white/5">
          <button
            type="button"
            onClick={() => setIsRiotOpen(!isRiotOpen)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-zinc-500 group-hover:text-[rgb(var(--accent-color))] transition-colors" />
              <div className="text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 group-hover:text-white transition-colors">
                  {t('LandingPage.profileEditor.settings.riotAccount.title')}
                </h3>
                {profile?.puuid && (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1">
                    {t('LandingPage.profileEditor.settings.riotAccount.status', { 
                      name: profile.riot_game_name || profile.game_name, 
                      tag: profile.riot_tag_line || profile.tag_line 
                    })}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown size={16} className={`text-zinc-600 transition-transform duration-300 ${isRiotOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isRiotOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 pb-4">
                  <FormInput
                    label={t('ProfilePage.editor.riotId')}
                    icon={UserIcon}
                    name="riot_game_name"
                    value={profile?.riot_game_name || ""}
                    onChange={onInputChange}
                    placeholder="Game Name"
                  />
                  <FormInput
                    label={t('ProfilePage.editor.tagline')}
                    icon={Hash}
                    name="riot_tag_line"
                    value={profile?.riot_tag_line || ""}
                    onChange={onInputChange}
                    placeholder="TAG"
                  />
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                      <Globe size={12} />
                      {t('LandingPage.discovery.filters.region.label')}
                    </label>
                    <select
                      name="riot_region"
                      value={profile?.riot_region || "EUW"}
                      onChange={onInputChange}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[rgb(var(--accent-color)/0.5)] transition-all outline-none appearance-none"
                    >
                      <option value="EUW">Europe West</option>
                      <option value="EUNE">Europe Nordic & East</option>
                      <option value="NA">North America</option>
                      <option value="KR">Korea</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <p className="text-[10px] text-zinc-500 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 italic">
                      {t('LandingPage.profileEditor.settings.riotAccount.description')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default GlobalSettingsSection;