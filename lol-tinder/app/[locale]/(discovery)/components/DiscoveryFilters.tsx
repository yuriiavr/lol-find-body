import React from "react";
import { Activity } from "lucide-react";

export const POPULAR_LANGUAGES = ["Ukrainian", "English", "Polish", "German", "French", "Spanish", "Italian", "Romanian", "Dutch", "Hungarian", "Czech"];

type AccentColor = 'orange' | 'blue' | 'red';

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  accentColor: AccentColor;
}

export function FilterSelect({ label, value, onChange, options, accentColor }: FilterSelectProps) {
  const focusColors = {
    orange: 'focus:border-orange-500/50 focus:ring-orange-500/20',
    blue: 'focus:border-blue-500/50',
    red: 'focus:border-red-500/50',
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all cursor-pointer appearance-none hover:border-white/10 ${focusColors[accentColor]}`}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

interface LanguageFilterProps {
  selectedLangs: string[];
  onToggle: (lang: string) => void;
  accentColor: AccentColor;
}

export function LanguageFilter({ selectedLangs, onToggle, accentColor }: LanguageFilterProps) {
  const activeColors = {
    orange: 'bg-orange-500/20 border-orange-500 text-orange-300',
    blue: 'bg-blue-500/20 border-blue-500 text-blue-300',
    red: 'bg-red-500/20 border-red-500 text-red-300',
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Language</label>
      <div className="flex flex-wrap gap-1">
        {POPULAR_LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
              selectedLangs.includes(lang) ? activeColors[accentColor] : 'bg-slate-900 border-white/5 text-slate-600'
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
  accentColor: AccentColor;
  label?: string;
}

export function OnlineToggle({ onlyOnline, onToggle, accentColor, label = "Live Online" }: OnlineToggleProps) {
  const activeColors = { orange: 'border-orange-500 bg-orange-500/10 text-orange-400', blue: 'border-blue-500 bg-blue-500/10 text-blue-400', red: 'border-red-500 bg-red-500/10 text-red-400' };

  return (
    <button 
      onClick={onToggle}
      className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${onlyOnline ? activeColors[accentColor] : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'}`}
    >
      <span className="text-xs font-bold uppercase">{label}</span>
      <Activity size={16} />
    </button>
  );
}