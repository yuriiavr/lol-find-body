import { memo, useState, useEffect } from "react";
import { Settings, User as UserIcon, Languages, Mic, Hash, Globe, ChevronDown } from "lucide-react";
import { FormInput, BadgeSelector, VoiceSwitch } from "@/src/components/ui/FormFields";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { getGameName, getTagLine, getRegion, getExtra } from "@/src/lib/profile";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/src/components/ToastProvider";

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
  const [isSteamOpen, setIsSteamOpen] = useState(false);
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Riot ID — спільний для lol/tft
  const riotGameName = getGameName(profile, 'lol');
  const riotTagLine  = getTagLine(profile, 'lol');
  const riotRegion   = getRegion(profile, 'lol');
  const puuid        = getExtra(profile, 'lol', 'puuid');

  // Steam
  const steamId       = profile?.steam_id ?? null;
  const steamUsername = profile?.steam_username ?? null;
  const isSteamLinked = !!steamId;

  // Показуємо тост після редиректу зі Steam callback
  useEffect(() => {
    const connected = searchParams.get('steam_connected');
    const error     = searchParams.get('steam_error');

    if (connected === '1') {
      showToast(t('ProfilePage.editor.steam.toastSuccess'), 'success');
      // Відкриваємо Steam секцію щоб юзер побачив результат
      setIsSteamOpen(true);
    }
    if (error) {
      const msgKey = error === 'not_authenticated'
        ? 'ProfilePage.editor.steam.toastErrorAuth'
        : 'ProfilePage.editor.steam.toastErrorGeneric';
      showToast(t(msgKey), 'error');
    }
  }, []);

  const handleConnectSteam = () => {
    window.location.href = '/api/auth/steam';
  };

  const handleDisconnectSteam = async () => {
    // Відключення — просто очищаємо поля через form input change
    // (батьківський стан оновиться, збережеться при наступному save)
    onInputChange({ target: { name: 'steam_id',       value: '', type: 'text' } } as any);
    onInputChange({ target: { name: 'steam_username', value: '', type: 'text' } } as any);
  };

  return (
    <div className="modern-panel p-8 mb-10 bg-white/[0.02] border-white/5">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <Settings size={18} className="text-zinc-500" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          {t('LandingPage.profileEditor.settings.title')}
        </h3>
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

        {/* ─── Riot Account ──────────────────────────────────────────────────── */}
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
                {puuid && riotGameName && (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1">
                    {t('LandingPage.profileEditor.settings.riotAccount.status', {
                      name: riotGameName,
                      tag: riotTagLine,
                    })}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-zinc-600 transition-transform duration-300 ${isRiotOpen ? 'rotate-180' : ''}`}
            />
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
                    value={riotGameName}
                    onChange={onInputChange}
                    placeholder="Game Name"
                  />
                  <FormInput
                    label={t('ProfilePage.editor.tagline')}
                    icon={Hash}
                    name="riot_tag_line"
                    value={riotTagLine}
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
                      value={riotRegion}
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

        {/* ─── Steam Account ─────────────────────────────────────────────────── */}
        <div className="md:col-span-2 pt-8 border-t border-white/5">
          <button
            type="button"
            onClick={() => setIsSteamOpen(!isSteamOpen)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-3">
              {/* Steam іконка */}
              <span className="text-zinc-500 group-hover:text-[#4c9be8] transition-colors">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.497 1.012 2.453-.397.957-1.494 1.41-2.458 1.014zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
                </svg>
              </span>

              <div className="text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 group-hover:text-white transition-colors">
                  {t('LandingPage.profileEditor.settings.steamAccount.title')}
                </h3>
                {isSteamLinked && steamUsername && (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1">
                    {t('LandingPage.profileEditor.settings.steamAccount.status', { name: steamUsername })}
                  </p>
                )}
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-zinc-600 transition-transform duration-300 ${isSteamOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {isSteamOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-8 pb-4 space-y-4">
                  {isSteamLinked ? (
                    <>
                      {/* Підключено — показуємо інфо і кнопку відключення */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#4c9be8]/10 border border-[#4c9be8]/20">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1b2838] border border-[#4c9be8]/30">
                          <svg width={20} height={20} viewBox="0 0 24 24" fill="#4c9be8">
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{steamUsername}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {steamId}</p>
                        </div>
                        <a
                          href={`https://steamcommunity.com/profiles/${steamId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-[#4c9be8] hover:underline uppercase tracking-widest shrink-0"
                        >
                          {t('LandingPage.profileEditor.settings.steamAccount.viewProfile')}
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={handleDisconnectSteam}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        {t('LandingPage.profileEditor.settings.steamAccount.disconnect')}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Не підключено — кнопка входу через Steam */}
                      <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                        {t('LandingPage.profileEditor.settings.steamAccount.description')}
                      </p>

                      <button
                        type="button"
                        onClick={handleConnectSteam}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#1b2838] hover:bg-[#2a3f5a] border border-[#4c9be8]/30 hover:border-[#4c9be8]/60 transition-all text-white font-bold text-sm shadow-lg shadow-[#4c9be8]/5"
                      >
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="#4c9be8">
                          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                        </svg>
                        {t('LandingPage.profileEditor.settings.steamAccount.connect')}
                      </button>
                    </>
                  )}
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