import { Crown, LayoutGrid, BookOpen, Info } from "lucide-react";
import { FormTextArea } from "@/src/components/ui/FormFields";
import { useTranslations } from "next-intl";

function fireChange(handler: (e: any) => void, name: string, value: string) {
  handler({ target: { name, value, type: "select" } } as any);
}

function Section({ icon: Icon, title, accentClass, children }: {
  icon: any; title: string; accentClass?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className={accentClass || "text-blue-400"} />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

interface TftFormProps {
  getGameValue: (field: string) => string;
  handleGameInputChange: (e: React.ChangeEvent<any>) => void;
  selectedQueues: string[];
  toggleQueue: (queue: string) => void;
}

export function TftForm({ getGameValue, handleGameInputChange, selectedQueues, toggleQueue }: TftFormProps) {
  const t = useTranslations("ProfilePage.editor.riotHint");
  const tftRanks = ["Unranked", "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Challenger"];
  const queues = ["Ranked", "Normal", "Hyper Roll", "Double Up"];
  const currentRank = getGameValue("rank") || "Unranked";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-400/70">
        <Info size={13} className="shrink-0" />
        <p className="text-[10px] font-bold leading-relaxed">
          {t("text")}{" "}
          <span className="text-blue-400 font-black">{t("link")}</span>
        </p>
      </div>
      <Section icon={Crown} title="Rank" accentClass="text-blue-400">
        <div className="grid grid-cols-5 gap-2">
          {tftRanks.map((rank) => {
            const on = currentRank === rank;
            return (
              <button key={rank} type="button"
                onClick={() => fireChange(handleGameInputChange, "rank", rank)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  on ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                     : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >{rank}</button>
            );
          })}
        </div>
      </Section>

      <Section icon={LayoutGrid} title="Mode" accentClass="text-blue-400">
        <div className="grid grid-cols-2 gap-2">
          {queues.map((q) => (
            <button key={q} type="button" onClick={() => toggleQueue(q)}
              className={`py-3 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >{q}</button>
          ))}
        </div>
      </Section>

      <Section icon={BookOpen} title="Bio" accentClass="text-blue-400">
        <FormTextArea label="" name="bio" value={getGameValue("bio")} onChange={handleGameInputChange}
          placeholder="Challenger TFT player, love reroll comps and Hyper Roll..." />
      </Section>
    </div>
  );
}