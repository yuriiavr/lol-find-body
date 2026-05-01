import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, ChevronDown, Gamepad2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useToast } from '@/src/components/ToastProvider';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: string;
  onSubmit: (description: string, mode: string, maxPlayers: number, minRank: string, maxRank: string) => Promise<void>;
  isLoading: boolean;
  modes?: string[];
  ranks?: string[];
}

// Reusable navbar-style dropdown
interface NavDropdownProps<T extends string | number> {
  value: T;
  options: T[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (v: T) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  renderLabel?: (v: T) => React.ReactNode;
  renderOption?: (v: T) => React.ReactNode;
  maxHeight?: string;
}

function NavDropdown<T extends string | number>({
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  dropdownRef,
  renderLabel,
  renderOption,
  maxHeight = '240px',
}: NavDropdownProps<T>) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between gap-2 w-full h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]"
        style={{ color: 'rgb(var(--accent-color))' }}
      >
        <span className="truncate">{renderLabel ? renderLabel(value) : value}</span>
        <ChevronDown
          size={10}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s',
          }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-[calc(100%+6px)] w-full rounded-lg overflow-y-auto z-[110]"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              maxHeight,
            }}
          >
            {options.map((opt) => (
              <button
                key={String(opt)}
                type="button"
                onClick={() => onSelect(opt)}
                className="w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-left transition-colors flex items-center justify-between gap-2"
                style={{
                  color: opt === value
                    ? 'rgb(var(--accent-color))'
                    : 'rgb(113,113,122)',
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  {renderOption ? renderOption(opt) : opt}
                </span>
                {opt === value && (
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgb(var(--accent-color))' }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CreateRoomModal({ isOpen, onClose, initialMode, onSubmit, isLoading, modes: customModes, ranks: customRanks }: CreateRoomModalProps) {
  const t = useTranslations('Rooms');
  const { showToast } = useToast();
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [minRank, setMinRank] = useState('ALL');
  const [maxRank, setMaxRank] = useState('ALL');

  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const [isMaxRankOpen, setIsMaxRankOpen] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<HTMLDivElement>(null);
  const rankRef = useRef<HTMLDivElement>(null);
  const maxRankRef = useRef<HTMLDivElement>(null);

  const modes = customModes || ['FLEX', 'NORMAL', 'ARAM', 'ARAM: MAYHEM', 'ARENA', 'QUICK PLAY', 'CUSTOM'];
  const ranks = customRanks || ['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER+'];

  useEffect(() => {
    if (isOpen) {
      const defaultMode = initialMode === 'ALL'
        ? (modes.includes('FLEX') ? 'FLEX' : modes.includes('RANKED') ? 'RANKED' : modes.includes('COMPETITIVE') ? 'COMPETITIVE' : modes[0])
        : initialMode;
      setMode(defaultMode);
      setMaxPlayers(5);
      setMinRank('ALL');
      setMaxRank('ALL');
    }
  }, [isOpen, initialMode, modes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(event.target as Node)) setIsModeOpen(false);
      if (playersRef.current && !playersRef.current.contains(event.target as Node)) setIsPlayersOpen(false);
      if (rankRef.current && !rankRef.current.contains(event.target as Node)) setIsRankOpen(false);
      if (maxRankRef.current && !maxRankRef.current.contains(event.target as Node)) setIsMaxRankOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast(t('roomDescriptionRequired'), 'error');
      return;
    }
    if (maxPlayers !== 5 && maxPlayers !== 10) {
      showToast(t('maxPlayersRange'), 'error');
      return;
    }
    await onSubmit(description, mode, maxPlayers, minRank, maxRank);
  };

  const rankOption = (r: string) => (
    <>
      {r !== 'ALL' && <Shield size={10} />}
      {r}
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modern-panel w-full max-w-lg p-8 relative bg-zinc-900/95 backdrop-blur-2xl border-white/10 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* Decorative Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgb(var(--accent-color))] to-transparent opacity-50" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg hover:bg-white/10"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-[rgb(var(--accent-color)/0.1)] text-[rgb(var(--accent-color))]">
                <Gamepad2 size={24} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">{t('createRoom')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                  {t('roomDescription')}
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('roomDescriptionPlaceholder')}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 text-sm outline-none focus:border-[rgb(var(--accent-color)/0.5)] focus:bg-white/[0.08] transition-all placeholder:text-zinc-600 text-white font-medium"
                  required
                />
              </div>

              {/* Mode + Max Players */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('filterMode')}
                  </label>
                  <NavDropdown
                    value={mode}
                    options={modes}
                    isOpen={isModeOpen}
                    onToggle={() => setIsModeOpen((v) => !v)}
                    onSelect={(v) => { setMode(v); setIsModeOpen(false); }}
                    dropdownRef={modeRef}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('maxPlayers')}
                  </label>
                  <NavDropdown
                    value={maxPlayers}
                    options={[5, 10]}
                    isOpen={isPlayersOpen}
                    onToggle={() => setIsPlayersOpen((v) => !v)}
                    onSelect={(v) => { setMaxPlayers(v); setIsPlayersOpen(false); }}
                    dropdownRef={playersRef}
                  />
                </div>
              </div>

              {/* Min + Max Rank */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('minRank')}
                  </label>
                  <NavDropdown
                    value={minRank}
                    options={ranks}
                    isOpen={isRankOpen}
                    onToggle={() => setIsRankOpen((v) => !v)}
                    onSelect={(v) => { setMinRank(v); setIsRankOpen(false); }}
                    dropdownRef={rankRef}
                    renderLabel={(v) => (
                      <span className="flex items-center gap-1.5">
                        <Shield size={10} className={v !== 'ALL' ? '' : 'opacity-40'} />
                        {v}
                      </span>
                    )}
                    renderOption={rankOption}
                    maxHeight="200px"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('maxRank')}
                  </label>
                  <NavDropdown
                    value={maxRank}
                    options={ranks}
                    isOpen={isMaxRankOpen}
                    onToggle={() => setIsMaxRankOpen((v) => !v)}
                    onSelect={(v) => { setMaxRank(v); setIsMaxRankOpen(false); }}
                    dropdownRef={maxRankRef}
                    renderLabel={(v) => (
                      <span className="flex items-center gap-1.5">
                        <Shield size={10} className={v !== 'ALL' ? '' : 'opacity-40'} />
                        {v}
                      </span>
                    )}
                    renderOption={rankOption}
                    maxHeight="200px"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-modern w-full flex items-center justify-center gap-3 py-4 px-6 text-sm font-bold uppercase tracking-widest"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
                {t('createRoom')}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}