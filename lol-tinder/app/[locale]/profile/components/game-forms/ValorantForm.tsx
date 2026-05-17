import { Zap, Target, Map, Shield, LayoutGrid, BookOpen, Users, User as UserIcon, Tag, Globe, Trophy } from "lucide-react";
import { FormInput, FormSelect, FormTextArea } from "@/src/components/ui/FormFields";
import { VALORANT_QUEUES } from "@/src/constants/queues";
import { VALORANT_RANKS_FULL } from "@/src/constants/ranks";

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
          <Icon size={14} className={accentClass || "text-red-400"} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">{title}</span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

const VALORANT_RANKS = VALORANT_RANKS_FULL;

const VALORANT_AGENTS = [
  "Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher",
  "Deadlock", "Fade", "Gekko", "Harbor", "Iso", "Jett", "KAY/O",
  "Killjoy", "Neon", "Omen", "Phoenix", "Raze", "Reyna", "Sage",
  "Skye", "Sova", "Viper", "Vyse", "Yoru",
];

interface ValorantFormProps {
  getGameValue: (field: string) => string;
  handleGameInputChange: (e: React.ChangeEvent<any>) => void;
  selectedQueues: string[];
  toggleQueue: (queue: string) => void;
  selectedAgents: string[];
  onToggleAgent?: (agent: string) => void;
}

export function ValorantForm({
  getGameValue, handleGameInputChange, selectedQueues, toggleQueue, selectedAgents, onToggleAgent,
}: ValorantFormProps) {
  const agentRoles = [
    { value: "DUELIST",    label: "Duelist",    icon: Zap,    desc: "Engage & frag" },
    { value: "INITIATOR",  label: "Initiator",  icon: Target, desc: "Set up plays" },
    { value: "CONTROLLER", label: "Controller", icon: Map,    desc: "Hold space" },
    { value: "SENTINEL",   label: "Sentinel",   icon: Shield, desc: "Lock down" },
  ];
  const queues = VALORANT_QUEUES;
  const currentRole = getGameValue("role") || "DUELIST";

  return (
    <div className="space-y-4">
      {/* Riot ID — Valorant separate account */}
      <Section icon={UserIcon} title="Riot ID" accentClass="text-red-400">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput label="Game Name" icon={UserIcon} name="val_game_name"
            value={getGameValue("game_name")} onChange={handleGameInputChange} placeholder="e.g. Faker" required />
          <FormInput label="Tag" icon={Tag} name="val_tag_line"
            value={getGameValue("tag_line")} onChange={handleGameInputChange} placeholder="TAG" required />
          <FormSelect label="Region" icon={Globe} name="val_region"
            value={getGameValue("region") || "EUW"} onChange={handleGameInputChange}>
            <option value="EUW">Europe West</option>
            <option value="EUNE">Europe NE</option>
            <option value="NA">North America</option>
            <option value="KR">Korea</option>
          </FormSelect>
        </div>
      </Section>

      <Section icon={Trophy} title="Rank" accentClass="text-red-400">
        <FormSelect label="" icon={Trophy} name="rank"
          value={getGameValue("rank") || "Unranked"} onChange={handleGameInputChange}>
          {VALORANT_RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </FormSelect>
      </Section>

      <Section icon={Zap} title="Your role" accentClass="text-red-400">
        <div className="grid grid-cols-2 gap-3">
          {agentRoles.map(({ value, label, icon: RIcon, desc }) => {
            const on = currentRole === value;
            return (
              <button key={value} type="button"
                onClick={() => fireChange(handleGameInputChange, "role", value)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  on ? "bg-red-500/15 border-red-500/40"
                     : "bg-white/[0.02] border-white/5 hover:border-white/15"
                }`}
              >
                <div className={`p-2 rounded-lg ${on ? "bg-red-500/20" : "bg-white/5"}`}>
                  <RIcon size={16} className={on ? "text-red-300" : "text-zinc-500"} />
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-wider ${on ? "text-red-200" : "text-zinc-400"}`}>{label}</p>
                  <p className={`text-[10px] ${on ? "text-red-400" : "text-zinc-600"}`}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {onToggleAgent && (
        <Section icon={Users} title="Top agents" accentClass="text-red-400"
          trailing={
            selectedAgents.length > 0 ? (
              <span className="text-[9px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                {selectedAgents.length} selected
              </span>
            ) : null
          }
        >
          <div className="flex flex-wrap gap-2">
            {VALORANT_AGENTS.map((agent) => (
              <button key={agent} type="button" onClick={() => onToggleAgent(agent)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedAgents.includes(agent)
                    ? "bg-red-500/15 border-red-500/40 text-red-300"
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                }`}
              >{agent}</button>
            ))}
          </div>
        </Section>
      )}

      <Section icon={LayoutGrid} title="Modes" accentClass="text-red-400">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {queues.map((q) => (
            <button key={q} type="button" onClick={() => toggleQueue(q)}
              className={`py-3 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                selectedQueues.includes(q)
                  ? "bg-red-500/15 border-red-500/40 text-red-300"
                  : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300"
              }`}
            >{q}</button>
          ))}
        </div>
      </Section>

      <Section icon={BookOpen} title="Bio" accentClass="text-red-400">
        <FormTextArea label="" name="bio" value={getGameValue("bio")} onChange={handleGameInputChange}
          placeholder="Immortal duelist main, grinding for Radiant. IGL experience..." />
      </Section>
    </div>
  );
}