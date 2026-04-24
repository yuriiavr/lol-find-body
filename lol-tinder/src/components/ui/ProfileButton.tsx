import React from "react";
import Link from "next/link";
import { User } from "lucide-react";

interface ProfileButtonProps {
  user: any;
  className?: string;
}

export function ProfileButton({ user, className = "" }: ProfileButtonProps) {
  if (!user) return null;

  return (
    <Link href="/profile" className={`flex items-center cursor-pointer gap-3 p-1.5 pr-5 bg-[rgb(var(--bg-primary))] rounded-full hover:bg-[rgb(var(--bg-secondary))] border border-white/5 transition-all ${className}`}>
      <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-[rgb(var(--accent-color)/0.3)]" alt="avatar" />
      <span className="text-sm font-bold">{user.user_metadata.full_name}</span>
    </Link>
  );
}

export function ViewProfileButton({ profileId, className = "" }: { profileId: string, className?: string }) {
  return (
    <Link href={`/profile/${profileId}`} className={className}>
      <button className="btn-modern cursor-pointer w-full py-3 text-[10px] flex items-center justify-center gap-2">
        <User size={14} /> View Profile
      </button>
    </Link>
  );
}