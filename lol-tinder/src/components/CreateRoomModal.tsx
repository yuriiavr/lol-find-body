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

  const modes = customModes || ['FLEX','NORMAL', 'ARAM', 'ARAM: MAYHEM', 'ARENA', 'QUICK PLAY', 'CUSTOM'];
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
  }, [isOpen, initialMode, t, modes]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(event.target as Node)) {
        setIsModeOpen(false);
      }
      if (playersRef.current && !playersRef.current.contains(event.target as Node)) {
        setIsPlayersOpen(false);
      }
      if (rankRef.current && !rankRef.current.contains(event.target as Node)) {
        setIsRankOpen(false);
      }
      if (maxRankRef.current && !maxRankRef.current.contains(event.target as Node)) {
        setIsMaxRankOpen(false);
      }
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="mode" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('filterMode')}
                  </label>
                  <div className="relative" ref={modeRef}>
                    <div 
                      onClick={() => setIsModeOpen(!isModeOpen)}
                      className={`w-full bg-white/5 border rounded-xl px-5 py-3 text-sm flex items-center justify-between cursor-pointer transition-all ${isModeOpen ? 'border-[rgb(var(--accent-color)/0.5)] bg-white/[0.08]' : 'border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className="text-white font-medium">{mode}</span>
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isModeOpen ? 'rotate-180 text-[rgb(var(--accent-color))]' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isModeOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
                        >
                          {modes.map((m) => (
                            <div 
                              key={m}
                              onClick={() => { setMode(m); setIsModeOpen(false); }}
                              className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${mode === m ? 'text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                            >
                              {m}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('maxPlayers')}
                  </label>
                  <div className="relative" ref={playersRef}>
                    <div 
                      onClick={() => setIsPlayersOpen(!isPlayersOpen)}
                      className={`w-full bg-white/5 border rounded-xl px-5 py-3 text-sm flex items-center justify-between cursor-pointer transition-all ${isPlayersOpen ? 'border-[rgb(var(--accent-color)/0.5)] bg-white/[0.08]' : 'border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <span className="text-white font-medium">{maxPlayers}</span>
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isPlayersOpen ? 'rotate-180 text-[rgb(var(--accent-color))]' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isPlayersOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
                        >
                          {[5, 10].map((num) => (
                            <div 
                              key={num}
                              onClick={() => { setMaxPlayers(num); setIsPlayersOpen(false); }}
                              className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer ${maxPlayers === num ? 'text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                            >
                              {num}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('minRank')}
                  </label>
                  <div className="relative" ref={rankRef}>
                    <div 
                      onClick={() => setIsRankOpen(!isRankOpen)}
                      className={`w-full bg-white/5 border rounded-xl px-5 py-3 text-sm flex items-center justify-between cursor-pointer transition-all ${isRankOpen ? 'border-[rgb(var(--accent-color)/0.5)] bg-white/[0.08]' : 'border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={14} className={minRank !== 'ALL' ? 'text-[rgb(var(--accent-color))]' : 'text-zinc-500'} />
                        <span className="text-white font-medium">{minRank}</span>
                      </div>
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isRankOpen ? 'rotate-180 text-[rgb(var(--accent-color))]' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isRankOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto scrollbar-thin"
                        >
                          {ranks.map((r) => (
                            <div 
                              key={r}
                              onClick={() => { setMinRank(r); setIsRankOpen(false); }}
                              className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer flex items-center gap-3 ${minRank === r ? 'text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                            >
                              {r !== 'ALL' && <Shield size={12} />}
                              {r}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t('maxRank')}
                  </label>
                  <div className="relative" ref={maxRankRef}>
                    <div 
                      onClick={() => setIsMaxRankOpen(!isMaxRankOpen)}
                      className={`w-full bg-white/5 border rounded-xl px-5 py-3 text-sm flex items-center justify-between cursor-pointer transition-all ${isMaxRankOpen ? 'border-[rgb(var(--accent-color)/0.5)] bg-white/[0.08]' : 'border-white/5 hover:bg-white/[0.08]'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={14} className={maxRank !== 'ALL' ? 'text-[rgb(var(--accent-color))]' : 'text-zinc-500'} />
                        <span className="text-white font-medium">{maxRank}</span>
                      </div>
                      <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isMaxRankOpen ? 'rotate-180 text-[rgb(var(--accent-color))]' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isMaxRankOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl max-h-48 overflow-y-auto scrollbar-thin"
                        >
                          {ranks.map((r) => (
                            <div 
                              key={r}
                              onClick={() => { setMaxRank(r); setIsMaxRankOpen(false); }}
                              className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer flex items-center gap-3 ${maxRank === r ? 'text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                            >
                              {r !== 'ALL' && <Shield size={12} />}
                              {r}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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