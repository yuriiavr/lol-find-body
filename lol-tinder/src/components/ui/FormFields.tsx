import React from "react";
import { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface BaseProps {
  label?: string;
  icon?: LucideIcon;
  className?: string;
}

export const FormInput = ({ label, icon: Icon, className = "", ...props }: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={`space-y-4 ${className}`}>
    {label && <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">{Icon && <Icon size={14} />} {label}</label>}
    <input
      {...props}
      className={`w-full bg-[rgb(var(--bg-secondary)/0.5)] border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-[rgb(var(--accent-color)/0.5)] focus:bg-[rgb(var(--bg-secondary))] transition-all placeholder:text-zinc-600`}
    />
  </div>
);

export const FormSelect = ({ label, icon: Icon, children, className = "", ...props }: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className={`space-y-4 ${className}`}>
    {label && <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">{Icon && <Icon size={14} />} {label}</label>}
    <select
      {...props}
      className={`w-full bg-[rgb(var(--bg-secondary)/0.5)] border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-[rgb(var(--accent-color)/0.5)] focus:bg-[rgb(var(--bg-secondary))] transition-all appearance-none cursor-pointer`}
    >
      {children}
    </select>
  </div>
);

export const FormTextArea = ({ label, className = "", ...props }: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className={`space-y-4 ${className}`}>
    {label && <label className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</label>}
    <textarea
      {...props}
      className={`w-full bg-[rgb(var(--bg-secondary)/0.5)] border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-[rgb(var(--accent-color)/0.5)] focus:bg-[rgb(var(--bg-secondary))] transition-all placeholder:text-zinc-600 h-32 resize-none`}
    />
  </div>
);

export const FormSwitch = ({ label, description, checked, onChange, name, className = "" }: BaseProps & { description?: string, checked: boolean, onChange: (e: any) => void, name?: string }) => {
  return (
  <div className={`p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between ${className}`}>
    <div className="space-y-1">
      {label && <h4 className="text-sm font-bold uppercase tracking-widest">{label}</h4>}
      {description && <p className="text-xs text-zinc-500">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={`w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--accent-color))]`}></div>
    </label>
  </div>
)};

export const VoiceSwitch = ({ checked, onChange, name, label, icon: Icon }: BaseProps & { checked: boolean, onChange: (e: any) => void, name?: string }) => {
  const t = useTranslations("Common");
  
  return (
    <div className="space-y-4">
    <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
      {Icon && <Icon size={14} />} {label}
    </label>
    <label className="relative inline-flex items-center cursor-pointer group">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={`w-14 h-7 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-[rgb(var(--accent-color))] peer-checked:after:bg-white border border-white/5 group-hover:border-white/10`}></div>
      <span className="ms-3 text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{t("micStatus")}</span>
    </label>
  </div>
)};

export const BadgeSelector = ({ items, selectedItems, onToggle, label, icon: Icon, className = "" }: BaseProps & { items: string[], selectedItems: string[], onToggle: (item: string) => void }) => (
  <div className={`space-y-4 ${className}`}>
    {label && <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">{Icon && <Icon size={14} />} {label}</label>}
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            selectedItems.includes(item) ? "bg-[rgb(var(--accent-color)/0.2)] border-[rgb(var(--accent-color)/0.5)] text-[rgb(var(--accent-color))] shadow-[0_0_15px_rgb(var(--accent-color)/0.1)]" : "bg-slate-800/40 border-white/5 text-slate-500 hover:border-white/10"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);