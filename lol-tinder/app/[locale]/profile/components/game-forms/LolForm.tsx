import { Shield, LayoutGrid, BookOpen, Info } from "lucide-react";
import { FormTextArea } from "@/src/components/ui/FormFields";
import { useTranslations } from "next-intl";

function fireChange(handler: (e: any) => void, name: string, value: string) {
  handler({ target: { name, value, type: "select" } } as any);
}

function Section({ icon: Icon, title, accentClass, children, trailing }: {
  icon: any; title: string; accentClass?: string; children: React.ReactNode; trailing?: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={accentClass || "text-amber-400"} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">{title}</span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

interface LolFormProps {
  getGameValue: (field: string) => string;
  handleGameInputChange: (e: React.ChangeEvent<any>) => void;
  selectedQueues: string[];
  toggleQueue: (queue: string) => void;
}

export function LolForm({ getGameValue, handleGameInputChange, selectedQueues, toggleQueue }: LolFormProps) {
  const t = useTranslations("ProfilePage.editor.riotHint");
  const lolRoles = [
    { value: "TOP",     label: "Top"     },
    { value: "JUNGLE",  label: "Jungle"  },
    { value: "MID",     label: "Mid"     },
    { value: "ADC",     label: "ADC"     },
    { value: "SUPPORT", label: "Support" },
    { value: "FILL",    label: "Fill"    },
  ];
  const queues = ["Solo/Duo", "Flex", "Draft", "ARAM", "Arena", "Quick Play", "Clash"];
  const currentRole = getGameValue("role") || "FILL";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400/70">
        <Info size={13} className="shrink-0" />
        <p className="text-[10px] font-bold leading-relaxed">
          {t("text")}{" "}
          <span className="text-amber-400 font-black">{t("link")}</span>
        </p>
      </div>
      <Section icon={Shield} title="Your lane" accentClass="text-amber-400">
        <div className="grid grid-cols-3 gap-2">
          {lolRoles.map(({ value, label }) => {
            const on = currentRole === value;
            return (
              <button key={value} type="button"
                onClick={() => fireChange(handleGameInputChange, "role", value)}
                className={`flex items-center justify-center py-3 rounded-xl border transition-all cursor-pointer ${
                  on ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                     : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={LayoutGrid} title="Queues you play" accentClass="text-amber-400">
        <div className="flex flex-wrap gap-2">
          {queues.map((q) => (
            <button key={q} type="button" onClick={() => toggleQueue(q)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >{q}</button>
          ))}
        </div>
      </Section>

      <Section icon={BookOpen} title="Bio" accentClass="text-amber-400">
        <FormTextArea label="" name="bio" value={getGameValue("bio")} onChange={handleGameInputChange}
          placeholder="Diamond top main LF consistent duo for climb..." />
      </Section>
    </div>
  );
}