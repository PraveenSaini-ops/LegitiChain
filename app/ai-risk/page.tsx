"use client";

import { useState, useEffect } from "react";
import { getAIRiskSignals, createAIRiskSignal, AIRiskSignalDB } from "@/lib/supabase";

export default function AIRiskSignalsPage() {
  const [riskSignals, setRiskSignals] = useState<AIRiskSignalDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRiskSignals = async () => {
    setIsLoading(true);
    try {
      const data = await getAIRiskSignals();
      setRiskSignals(data);
    } catch (err: any) {
      console.error("Failed to load AI risk signals:", err);
      setErrorMsg("Failed to load AI risk signals from Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskSignals();
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);

    const sampleFiles = [
      { name: "Device_Image_MacBookPro_04.dmg", level: "LOW" as const, score: 98, flags: ["Clean EXIF Header", "Consistent File Offsets", "Entropy Score Nominal (7.82)"] },
      { name: "CCTV_Lobby_Cam02_20260819.mp4", level: "MEDIUM" as const, score: 64, flags: ["Frame Rate Disparity at 04:12", "Non-standard H.264 GOP structure"] },
      { name: "Financial_Ledger_2025.xlsx", level: "HIGH" as const, score: 28, flags: ["Timestamp Modification Detected", "Orphaned Macro Stream Present", "Hash Disparity"] },
      { name: "Packet_Trace_Capture_01.pcap", level: "LOW" as const, score: 95, flags: ["No Anomalous Packets Detected", "Protocol Structure Nominal"] },
    ];

    const chosen = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];

    const newSignal: AIRiskSignalDB = {
      evidence_id: `EVI-2026-${Math.floor(9000 + Math.random() * 900)}`,
      target_file: chosen.name,
      confidence_score: chosen.score,
      risk_level: chosen.level,
      flags: chosen.flags,
      created_at: new Date().toISOString(),
    };

    const { error } = await createAIRiskSignal(newSignal);

    if (error) {
      if (error.message?.includes("row-level security") || error.message?.includes("RLS")) {
        setErrorMsg("Supabase RLS Note: Please sign in at /login (or execute fix_submitter_address_and_rls.sql in Supabase SQL Editor) to persist signals to DB. Displaying scan result in local session.");
      } else {
        setErrorMsg("Database save note: " + error.message);
      }
      setRiskSignals((prev) => [newSignal, ...prev]);
    } else {
      await loadRiskSignals();
    }
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2926] tracking-tight mb-2">AI Forensic Risk Signals</h1>
          <p className="text-[#414942] text-sm">
            Automated deep inspection for file entropy, EXIF anomalies, timestamp shifts, and structural integrity.
          </p>
        </div>
        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="px-5 py-2.5 bg-[#002411] text-white rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-[#063b21] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isScanning ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">neurology</span>
          )}
          {isScanning ? "Scanning Payload..." : "Trigger Forensic Scan"}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Risk Signals Grid */}
      {isLoading ? (
        <div className="py-12 bg-white border border-[#E5E0D5] rounded-xl text-center text-xs font-mono text-[#717972]">
          <span className="material-symbols-outlined animate-spin text-[24px] mb-2 block">sync</span>
          Querying AI risk signals from Supabase...
        </div>
      ) : riskSignals.length === 0 ? (
        <div className="py-12 bg-white border border-[#E5E0D5] rounded-xl text-center text-xs text-[#717972] flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#c1baa8]">neurology</span>
          <div>
            <p className="font-semibold text-[#2D2926] text-sm">No Risk Signals Logged Yet</p>
            <p className="mt-1">Trigger a forensic scan to analyze evidence files for structural and cryptographic anomalies.</p>
          </div>
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="mt-2 px-4 py-2 bg-[#002411] text-white rounded text-xs font-semibold uppercase tracking-wider"
          >
            Run Initial Forensic Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {riskSignals.map((signal) => (
            <div
              key={signal.id || signal.created_at}
              className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 items-start md:items-center ${
                signal.risk_level === "HIGH" || signal.risk_level === "CRITICAL"
                  ? "border-[#C34A36] bg-[#ffdad6]/10"
                  : signal.risk_level === "MEDIUM"
                  ? "border-[#7a580f] bg-[#ffd07e]/10"
                  : "border-[#E5E0D5]"
              }`}
            >
              <div className="flex gap-4 items-start">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg font-mono border ${
                    signal.risk_level === "HIGH" || signal.risk_level === "CRITICAL"
                      ? "bg-[#ffdad6] text-[#ba1a1a] border-[#C34A36]"
                      : signal.risk_level === "MEDIUM"
                      ? "bg-[#ffd07e] text-[#79570e] border-[#7a580f]"
                      : "bg-[#baefc9] text-[#00210f] border-[#38684a]"
                  }`}
                >
                  {signal.confidence_score}%
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs font-bold text-[#2D2926]">{signal.evidence_id}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        signal.risk_level === "HIGH" || signal.risk_level === "CRITICAL"
                          ? "bg-[#ffdad6] text-[#ba1a1a]"
                          : signal.risk_level === "MEDIUM"
                          ? "bg-[#ffd07e] text-[#79570e]"
                          : "bg-[#baefc9] text-[#00210f]"
                      }`}
                    >
                      {signal.risk_level} RISK
                    </span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#2D2926]">{signal.target_file}</div>
                  <div className="text-xs text-[#717972] font-mono mt-1">
                    Scanned at: {signal.created_at ? new Date(signal.created_at).toLocaleString() : "Just now"}
                  </div>
                </div>
              </div>

              {/* Risk Flags List */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#717972] tracking-wider mb-1">
                  Inspection Finding Flags:
                </span>
                {signal.flags && signal.flags.map((flag, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[#2D2926]">
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        signal.risk_level === "HIGH" || signal.risk_level === "CRITICAL"
                          ? "text-[#ba1a1a]"
                          : signal.risk_level === "MEDIUM"
                          ? "text-[#7a580f]"
                          : "text-[#38684a]"
                      }`}
                    >
                      {signal.risk_level === "HIGH" || signal.risk_level === "CRITICAL" ? "error" : "check_circle"}
                    </span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
