"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, user, profile, signOut } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<UserRole>("INVESTIGATOR");

  const rolesList: { role: UserRole; label: string; desc: string; icon: string }[] = [
    {
      role: "INVESTIGATOR",
      label: "Lead Investigator",
      desc: "Upload primary evidence, record chain-of-custody, and track status",
      icon: "search",
    },
    {
      role: "FORENSIC_EXPERT",
      label: "Forensic Analyst",
      desc: "Analyze digital evidence, log AI risk signals, and anchor hashes",
      icon: "fingerprint",
    },
    {
      role: "LEGAL_AUDITOR",
      label: "Legal Auditor",
      desc: "Audit evidence custody timeline, verify integrity, and export reports",
      icon: "gavel",
    },
    {
      role: "ADMIN",
      label: "System Administrator",
      desc: "Full system administration, user management, and contract management",
      icon: "admin_panel_settings",
    },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Successfully logged in!");
        setTimeout(() => router.push("/"), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp({
        email,
        password,
        fullName,
        organization: organization || "Independent Forensic Agency",
        role,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Registration successful! Account created and role assigned.");
        setTimeout(() => router.push("/"), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (user && profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-[#1F2023] border border-white/10 rounded-2xl p-8 text-white text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#002411] border border-[#74a684] rounded-full flex items-center justify-center mx-auto mb-4 text-[#FFEADB]">
            <span className="material-symbols-outlined text-[32px]">verified_user</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Authenticated Session</h2>
          <p className="text-white/60 text-sm mb-6">
            Signed in as <span className="text-[#FFEADB] font-mono">{user.email}</span>
          </p>

          <div className="bg-white/5 rounded-xl p-4 mb-8 text-left border border-white/10 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Full Name:</span>
              <span className="text-white font-semibold">{profile.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Organization:</span>
              <span className="text-white font-semibold">{profile.organization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Assigned Role:</span>
              <span className="px-2 py-0.5 rounded bg-[#002411] text-[#9fd2ae] border border-[#74a684]/40 font-bold">
                {profile.role}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-[#FFEADB] text-[#1F2023] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => signOut()}
              className="px-6 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-500/30 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1F2023] border border-white/10 rounded-full text-[#FFEADB] text-xs font-mono mb-3">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Supabase Forensic Authentication & Role Management
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1F2023]">
          LegitiChain Access Portal
        </h1>
        <p className="text-sm text-[#717972] mt-1">
          Select your institutional role to authenticate cryptographic proof privileges
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-[#1F2023] border border-white/10 rounded-2xl shadow-2xl p-8 text-white">
        {/* Toggle Mode */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-3 text-center text-xs uppercase font-bold tracking-widest border-b-2 transition ${
              mode === "login"
                ? "border-[#74a684] text-[#FFEADB]"
                : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-3 text-center text-xs uppercase font-bold tracking-widest border-b-2 transition ${
              mode === "signup"
                ? "border-[#74a684] text-[#FFEADB]"
                : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            Register & Assign Role
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-2">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@agency.gov"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#74a684] transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-2">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#74a684] transition font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#FFEADB] text-[#1F2023] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Authenticate Session
                </>
              )}
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignUpSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-2">
                  Full Name / Identifier
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Det. Alex Mercer"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#74a684] transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-2">
                  Organization / Department
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Federal Forensic Cyber Division"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#74a684] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-2">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.mercer@cyber-forensics.org"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#74a684] transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#74a684] transition font-mono"
              />
            </div>

            {/* Role Selection Grid */}
            <div>
              <label className="block text-xs uppercase font-semibold tracking-wider text-white/70 mb-3">
                Select Your System Role (Sets RLS Privileges)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rolesList.map((r) => {
                  const isSelected = role === r.role;
                  return (
                    <div
                      key={r.role}
                      onClick={() => setRole(r.role)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? "bg-[#002411] border-[#74a684] text-white shadow-lg"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-[#74a684]/20 text-[#9fd2ae]" : "bg-white/10 text-white/50"}`}>
                        <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between">
                          {r.label}
                          {isSelected && (
                            <span className="material-symbols-outlined text-emerald-400 text-[16px]">check_circle</span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/60 mt-1 leading-snug">{r.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#FFEADB] text-[#1F2023] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Creating User & Assigning Role...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Complete Registration & Role Setup
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
