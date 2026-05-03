import { Target, LayoutGrid, BookOpen, Hash, Copy, Check, Info } from "lucide-react";
import { FormTextArea } from "@/src/components/ui/FormFields";
import { useTranslations } from "next-intl";
import { useState } from "react";

function fireChange(handler: (e: any) => void, name: string, value: string) {
  handler({ target: { name, value, type: "select" } } as any);
}

function Section({
  icon: Icon,
  title,
  accentClass,
  children,
  trailing,
}: {
  icon: any;
  title: string;
  accentClass?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={accentClass || "text-orange-400"} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
            {title}
          </span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

const CS2_RANKS = [
  "Unranked",
  "Silver I",
  "Silver II",
  "Silver III",
  "Silver IV",
  "Silver Elite",
  "Silver Elite Master",
  "Gold Nova I",
  "Gold Nova II",
  "Gold Nova III",
  "Gold Nova Master",
  "Master Guardian I",
  "Master Guardian II",
  "Master Guardian Elite",
  "Distinguished Master Guardian",
  "Legendary Eagle",
  "Legendary Eagle Master",
  "Supreme Master First Class",
  "Global Elite",
];

const CS2_ROLES = [
  { value: "ENTRY",   label: "Entry Fragger",  desc: "First in, win the duel" },
  { value: "LURKER",  label: "Lurker",         desc: "Flank & distract" },
  { value: "SUPPORT", label: "Support",        desc: "Flash & trade" },
  { value: "AWP",     label: "AWPer",          desc: "Long-range carry" },
  { value: "IGL",     label: "IGL",            desc: "In-game leader" },
  { value: "FILL",    label: "Fill",           desc: "Play what's needed" },
];

interface Cs2FormProps {
  getGameValue: (field: string) => string;
  handleGameInputChange: (e: React.ChangeEvent<any>) => void;
  selectedQueues: string[];
  toggleQueue: (queue: string) => void;
}

export function Cs2Form({
  getGameValue,
  handleGameInputChange,
  selectedQueues,
  toggleQueue,
}: Cs2FormProps) {
  const t = useTranslations("ProfilePage.editor.cs2");
  const [copiedCode, setCopiedCode] = useState(false);
  const queues = ["Competitive", "Premier", "Wingman", "Casual", "Deathmatch", "Workshop"];
  const currentRole = getGameValue("role") || "FILL";
  const currentRank = getGameValue("rank") || "Unranked";
  const friendCode  = getGameValue("friend_code") || "";

  const handleCopyCode = () => {
    if (!friendCode) return;
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Friend Code — preview only, auto-generated from Steam */}
      {friendCode && (
        <Section
          icon={Hash}
          title={t("friendCode")}
          accentClass="text-orange-400"
          trailing={
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider hover:bg-orange-500/20 transition-all"
            >
              {copiedCode ? (
                <><Check size={11} /> {t("copied")}</>
              ) : (
                <><Copy size={11} /> {t("copy")}</>
              )}
            </button>
          }
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <span className="text-sm font-mono font-bold text-zinc-200">{friendCode}</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed italic mt-2">
            {t("friendCodeAutoHint")}
          </p>
        </Section>
      )}

      {/* Rank */}
      <Section icon={Target} title={t("rank")} accentClass="text-orange-400">
        <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
          {CS2_RANKS.map((rank) => {
            const on = currentRank === rank;
            return (
              <button
                key={rank}
                type="button"
                onClick={() => fireChange(handleGameInputChange, "rank", rank)}
                className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer text-left leading-tight ${
                  on
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                {rank}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Modes */}
      <Section icon={LayoutGrid} title={t("modes")} accentClass="text-orange-400">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {queues.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => toggleQueue(q)}
              className={`py-3 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </Section>

      {/* Bio */}
      <Section icon={BookOpen} title={t("bio")} accentClass="text-orange-400">
        <FormTextArea
          label=""
          name="bio"
          value={getGameValue("bio")}
          onChange={handleGameInputChange}
          placeholder={t("bioPlaceholder")}
        />
      </Section>
    </div>
  );
}