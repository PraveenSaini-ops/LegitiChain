"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { user, profile, signOut, loading } = useAuth();

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"));
  };

  return (
    <header className="fixed top-0 left-0 lg:left-[280px] right-0 h-16 sm:h-20 bg-[#fff8f2]/90 backdrop-blur-md z-40 px-4 sm:px-8 flex items-center justify-between border-b border-[#E5E0D5] transition-all duration-300">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg bg-[#1F2023] text-white flex items-center justify-center hover:bg-black transition"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="hidden sm:block w-1.5 h-8 bg-[#1F2023] rounded-full"></div>
        <div>
          <span className="text-[11px] sm:text-[12px] font-bold text-[#414942] uppercase tracking-[0.15em] sm:tracking-[0.2em] block truncate">
            Forensic Integrity Hub
          </span>
          <span className="text-[9px] sm:text-[10px] text-[#717972] font-mono uppercase tracking-wider block">
            Polygon Amoy Verification
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden md:flex flex-col items-end pr-4 border-r border-[#E5E0D5]">
          <span className="text-[11px] font-bold text-[#2D2926] uppercase tracking-wider">Polygon Amoy</span>
          <span className="text-[10px] font-mono text-[#717972]">CHAIN_ID: 80002</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 bg-[#1F2023] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[#FFEADB] text-xs font-mono">
            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
            <span className="hidden sm:inline">Checking Auth...</span>
          </div>
        ) : user && profile ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-[#1F2023] tracking-tight max-w-[100px] sm:max-w-none truncate">
                {profile.full_name}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1F2023] text-[#9fd2ae] uppercase tracking-wider">
                {profile.role}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              title="Sign Out Session"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1F2023] hover:bg-red-900/80 text-white flex items-center justify-center transition border border-black/10 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">logout</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 bg-[#1F2023] hover:bg-black text-[#FFEADB] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition border border-white/10 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span className="hidden sm:inline">Sign In / Role</span>
            <span className="sm:hidden">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
