import { memo } from "react";
import { Settings, User as UserIcon, Languages, Mic } from "lucide-react";
import { FormInput, BadgeSelector, VoiceSwitch } from "@/src/components/ui/FormFields";
import { useTranslations } from "next-intl";

interface GlobalSettingsSectionProps {
  profile: any;
  selectedLangs: string[];
  onToggleLang: (lang: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  popularLanguages: string[];
}

const GlobalSettingsSection = memo(({ profile, selectedLangs, onToggleLang, onInputChange, popularLanguages }: GlobalSettingsSectionProps) => {
  const t = useTranslations();

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
      </div>
    </div>
  );
});

export default GlobalSettingsSection;