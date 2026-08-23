"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { user, profile, signOut, loading } = useAuth();

  return (
    <header className="fixed top-0 left-[280px] right-0 h-20 bg-[#fff8f2]/90 backdrop-blur-md z-40 px-8 flex items-center justify-between border-b border-[#E5E0D5]">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-[#1F2023] rounded-full"></div>
        <div>
          <span className="text-[12px] font-bold text-[#414942] uppercase tracking-[0.2em] block">
            Forensic Integrity Hub
          </span>
          <span className="text-[10px] text-[#717972] font-mono uppercase tracking-wider">
            Polygon Amoy Chain Verification
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex flex-col items-end pr-4 border-r border-[#E5E0D5]">
          <span className="text-[11px] font-bold text-[#2D2926] uppercase tracking-wider">Polygon Amoy</span>
          <span className="text-[10px] font-mono text-[#717972]">CHAIN_ID: 80002</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 bg-[#1F2023] px-4 py-2 rounded-full text-[#FFEADB] text-xs font-mono">
            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
            <span>Checking Auth...</span>
          </div>
        ) : user && profile ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-[#1F2023] tracking-tight">{profile.full_name}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1F2023] text-[#9fd2ae] uppercase tracking-wider">
                {profile.role}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              title="Sign Out Session"
              className="w-9 h-9 rounded-full bg-[#1F2023] hover:bg-red-900/80 text-white flex items-center justify-center transition border border-black/10"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 bg-[#1F2023] hover:bg-black text-[#FFEADB] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition border border-white/10 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In / Assign Role</span>
          </Link>
        )}
      </div>
    </header>
  );
}
