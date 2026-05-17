import React from "react";
import { LucideIcon } from "lucide-react";

interface DiscoverySidebarProps {
  title: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}

export function DiscoverySidebar({ title, Icon, children }: DiscoverySidebarProps) {
  return (
    <aside className="w-full lg:w-80 space-y-6">
      <div className="modern-panel p-6">
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
          <Icon size={18} className="discovery-accent-icon" />
          <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] text-zinc-500">{title}</h3>
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </aside>
  );
}