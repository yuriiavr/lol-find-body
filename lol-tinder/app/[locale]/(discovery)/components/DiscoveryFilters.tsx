import React, { useState, useRef } from "react";
import { Activity, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useClickOutside } from "@/src/hooks/useClickOutside";
import { POPULAR_LANGUAGES } from "@/src/constants/languages";

export { POPULAR_LANGUAGES };

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center justify-between gap-1.5 w-full h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] hover:text-zinc-300 transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]"
        >
          <span className="discovery-accent-text">{selected?.label ?? value}</span>
          <ChevronDown
            size={10}
            strokeWidth={2}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s",
              flexShrink: 0,
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
              className="absolute left-0 top-[calc(100%+6px)] rounded-lg overflow-hidden z-[110]"
              style={{
                background: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: "100%",
              }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className="w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-left transition-colors flex items-center justify-between whitespace-nowrap discovery-dropdown-item"
                  data-active={value === opt.value ? "true" : undefined}
                >
                  {opt.label}
                  {value === opt.value && (
                    <span className="w-1 h-1 rounded-full ml-2 flex-shrink-0 discovery-accent-dot" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface LanguageFilterProps {
  selectedLangs: string[];
  onToggle: (lang: string) => void;
}

export function LanguageFilter({ selectedLangs, onToggle }: LanguageFilterProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Language</label>
      <div className="flex flex-wrap gap-1">
        {POPULAR_LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
              selectedLangs.includes(lang)
                ? 'discovery-lang-active'
                : 'bg-slate-900 border-white/5 text-slate-600'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
}

interface OnlineToggleProps {
  onlyOnline: boolean;
  onToggle: () => void;
  label?: string;
}

export function OnlineToggle({ onlyOnline, onToggle, label = "Live Online" }: OnlineToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-between w-full h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] border transition-colors duration-150 ${
        onlyOnline ? 'discovery-online-active' : 'border-white/[0.06] text-zinc-500'
      }`}
    >
      <span>{label}</span>
      <Activity size={12} strokeWidth={2} />
    </button>
  );
}