import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
      <Loader2 
        className="animate-spin text-[rgb(var(--accent-color))]" 
        size={48} 
      />
    </div>
  );
}