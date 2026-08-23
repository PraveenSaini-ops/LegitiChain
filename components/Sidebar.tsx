"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    window.addEventListener("close-mobile-sidebar", handleClose);

    return () => {
      window.removeEventListener("toggle-mobile-sidebar", handleToggle);
      window.removeEventListener("close-mobile-sidebar", handleClose);
    };
  }, []);

  // Close sidebar on path change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/", icon: "dashboard" },
    { label: "Upload Evidence", href: "/upload", icon: "upload_file" },
    { label: "Verify", href: "/verify", icon: "verified_user" },
    { label: "Custody Log", href: "/custody", icon: "history_edu" },
    { label: "AI Risk Signals", href: "/ai-risk", icon: "emergency_home" },
    { label: "Auth Portal", href: "/login", icon: "badge" },
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-[280px] bg-[#1F2023] z-50 flex flex-col py-8 border-r border-white/5 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#002411] border border-[#74a684]/30 flex items-center justify-center text-[#FFEADB]">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div>
              <div className="font-bold text-white text-lg tracking-tight">LegitiChain</div>
              <div className="text-[10px] text-[#9fd2ae] uppercase tracking-widest font-mono">Digital Evidence Integrity</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-white/60 hover:text-white p-1"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all group ${
                  isActive
                    ? "bg-white/10 text-[#FFEADB] font-bold shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
                <span className="text-[12px] uppercase tracking-widest font-semibold">{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-white/10 mx-4"></div>

          {/* User Role Card */}
          <div className="mx-2 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">Active User Role</div>
            {user && profile ? (
              <div>
                <div className="text-xs font-bold text-[#FFEADB]">{profile.role}</div>
                <div className="text-[11px] text-white/60 truncate">{profile.organization}</div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-yellow-300">GUEST SESSION</div>
                <div className="text-[10px] text-white/50">Click &apos;Auth Portal&apos; to sign in</div>
              </div>
            )}
          </div>
        </nav>

        <div className="px-6 text-white/30 text-[10px] font-mono uppercase tracking-wider">
          Node: Polygon Amoy (80002)
        </div>
      </aside>
    </>
  );
}
