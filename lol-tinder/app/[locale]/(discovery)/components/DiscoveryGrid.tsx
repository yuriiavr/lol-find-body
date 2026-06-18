import React from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, Search, AlertTriangle } from "lucide-react";

interface DiscoveryGridProps {
  isFetching: boolean;
  players: any[];
  emptyMessage: string;
  children: React.ReactNode;
  error?: string | null;
}

export function DiscoveryGrid({ isFetching, players, emptyMessage, children, error }: DiscoveryGridProps) {
  if (isFetching) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="animate-spin discovery-accent-icon opacity-50" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-40 flex flex-col items-center gap-4 text-red-400/70">
        <AlertTriangle size={56} className="opacity-30" />
        <p className="font-bold uppercase tracking-widest text-sm">Failed to load players</p>
        <p className="text-[11px] text-zinc-600 max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="main-grid">
      <AnimatePresence mode="popLayout">
        {players.length > 0 ? children : (
          <div className="col-span-full py-40 flex flex-col items-center gap-4 text-slate-600">
            <Search size={64} className="opacity-10" />
            <p className="font-bold uppercase tracking-widest text-sm">{emptyMessage}</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
