"use client";

import { useState } from "react";
import Link from "next/link";

export default function OperationsDashboard() {
  const [quickFileHash, setQuickFileHash] = useState<string | null>(null);
  const [quickFileName, setQuickFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setQuickFileName(file.name);

    // Calculate SHA-256 using Web Crypto API
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    setTimeout(() => {
      setQuickFileHash(`0x${hashHex}`);
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full gap-6 sm:gap-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2926] tracking-tight mb-2">Operations Dashboard</h1>
          <p className="text-[#414942] flex items-center gap-2 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9fd2ae] inline-block animate-pulse shrink-0"></span>
            System nominal. All forensic nodes synced on Polygon Amoy.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/verify"
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 border border-[#E5E0D5] rounded-lg text-xs font-semibold uppercase tracking-widest text-[#2D2926] hover:bg-[#efe7de] transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Verify
          </Link>
          <Link
            href="/upload"
            className="flex-1 sm:flex-none px-4 sm:px-5 bg-[#002411] text-white rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-[#063b21] transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Upload
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#ffffff] border border-[#E5E0D5] rounded-xl p-5 sm:p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#fff8f2] rounded-lg">
              <span className="material-symbols-outlined text-[#717972]">inventory_2</span>
            </div>
            <span className="text-[10px] font-mono text-[#414942] bg-[#fff8f2] px-2 py-1 rounded">ALL TIME</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2D2926] mb-1">12,840</div>
          <div className="text-[11px] font-semibold text-[#414942] uppercase tracking-widest">Total Securified</div>
        </div>

        <div className="bg-[#ffffff] border border-[#E5E0D5] rounded-xl p-5 sm:p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#fff8f2] rounded-lg">
              <span className="material-symbols-outlined text-[#38684a]">hourglass_empty</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#38684a] animate-pulse"></span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2D2926] mb-1">156</div>
          <div className="text-[11px] font-semibold text-[#414942] uppercase tracking-widest">Pending On-Chain</div>
        </div>

        <div className="bg-[#ffffff] border border-[#E5E0D5] rounded-xl p-5 sm:p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#fff8f2] rounded-lg">
              <span className="material-symbols-outlined text-[#6a5c50]">swap_horiz</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2D2926] mb-1">45,212</div>
          <div className="text-[11px] font-semibold text-[#414942] uppercase tracking-widest">Custody Events</div>
        </div>

        <div className="bg-[#ffdad6]/20 border border-[#C34A36]/30 rounded-xl p-5 sm:p-6 shadow-sm hover:-translate-y-0.5 transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#ffdad6] rounded-lg text-[#ba1a1a]">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-1 rounded">ALERT</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#ba1a1a] mb-1">3</div>
          <div className="text-[11px] font-semibold text-[#ba1a1a] uppercase tracking-widest">Tamper Flags Active</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Timeline & Authorization */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Activity Ledger Card */}
          <div className="bg-[#ffffff] border border-[#E5E0D5] rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#FFEADB] px-4 sm:px-6 py-4 border-b border-[#E5E0D5] flex justify-between items-center">
              <h2 className="font-semibold text-base sm:text-lg text-[#370c14]">Recent Chain Activity</h2>
              <Link href="/custody" className="text-xs font-semibold uppercase tracking-widest text-[#6c373d] hover:underline">
                View Ledger
              </Link>
            </div>
            <div className="p-4 sm:p-6">
              <div className="relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-[#E5E0D5] flex flex-col gap-6">
                
                {/* Activity 1 */}
                <div className="relative pl-10 sm:pl-12">
                  <div className="absolute left-0 top-1 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#9fd2ae] flex items-center justify-center border-4 border-white z-10 text-[#063b21]">
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">upload_file</span>
                  </div>
                  <div className="bg-[#fff8f2] border border-[#E5E0D5] rounded-lg p-3.5 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-2">
                      <p className="text-xs sm:text-sm text-[#2D2926]">
                        <span className="font-semibold">Officer Sarah Chen</span> anchored <span className="italic">Evidence_Batch_A92.zip</span>
                      </p>
                      <span className="text-[11px] sm:text-xs font-mono text-[#717972]">10:42 AM</span>
                    </div>
                    <div className="bg-[#f4ede4] p-3 rounded border border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white border border-[#E5E0D5] flex items-center justify-center text-[#717972] shrink-0">
                          <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                        </div>
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#2D2926]">Evidence_Batch_A92.zip</div>
                          <div className="text-[11px] text-[#414942]">42.5 MB • 14 files</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] sm:text-[11px] text-[#414942] bg-white px-2 py-1 border border-[#E5E0D5] rounded break-all">
                        SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="relative pl-10 sm:pl-12">
                  <div className="absolute left-0 top-1 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#f3dfd0] flex items-center justify-center border-4 border-white z-10 text-[#241911]">
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">neurology</span>
                  </div>
                  <div className="bg-[#fff8f2] border border-[#E5E0D5] rounded-lg p-3.5 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-2">
                      <p className="text-xs sm:text-sm text-[#2D2926]">
                        <span className="font-semibold">AI Forensic Engine</span> completed risk scan
                      </p>
                      <span className="text-[11px] sm:text-xs font-mono text-[#717972]">09:15 AM</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3">
                      <div className="w-full sm:w-28 border border-[#E5E0D5] rounded p-3 flex sm:flex-col items-center justify-center bg-white gap-2 sm:gap-0">
                        <span className="text-xl font-bold text-[#38684a]">98%</span>
                        <span className="text-[10px] text-[#414942] uppercase font-semibold">Integrity</span>
                      </div>
                      <div className="flex-1 bg-[#faf2e9] border border-[#E5E0D5] rounded p-3 text-xs">
                        <p className="font-mono text-[#2D2926] mb-1 break-all">Target: Device_Image_MacBookPro_04.dmg</p>
                        <p className="font-mono text-[#38684a] font-semibold">Flags: 0 Anomaly Detected</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Action Alert Banner */}
          <div className="bg-[#3a0e16] border border-[#54232a] rounded-xl shadow-lg p-5 sm:p-6 text-white relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#ffd9dc] mb-1">Authorization Required</h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-md">
                  2 evidence records pending custodial transfer confirmation to long-term vault.
                </p>
              </div>
              <Link
                href="/custody"
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#3a0e16] rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-[#ffd9dc] transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                Review Ledger
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Analysis & Network */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Analysis Dropzone */}
          <div className="bg-[#ffffff] border border-[#E5E0D5] rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-[#414942] uppercase tracking-widest mb-4">
              Quick Client-Side Hash Analysis
            </h3>
            <label className="w-full h-36 border-2 border-dashed border-[#E5E0D5] rounded-lg flex flex-col items-center justify-center bg-[#faf2e9] hover:bg-[#efe7de] transition-colors cursor-pointer p-4 text-center">
              <span className="material-symbols-outlined text-3xl text-[#717972] mb-2">fingerprint</span>
              <span className="text-xs font-semibold text-[#2D2926]">Drop file to generate SHA-256</span>
              <span className="text-[10px] text-[#717972] mt-1">Calculates hash browser-side in real-time</span>
              <input type="file" onChange={handleQuickFileChange} className="hidden" />
            </label>

            {isAnalyzing && (
              <div className="mt-4 p-3 bg-[#FFEADB] rounded-lg text-xs font-mono text-[#370c14] animate-pulse text-center">
                Computing cryptographic hash...
              </div>
            )}

            {quickFileHash && !isAnalyzing && (
              <div className="mt-4 p-3 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg text-xs">
                <div className="font-semibold text-[#2D2926] mb-1 truncate">File: {quickFileName}</div>
                <div className="font-mono text-[11px] text-[#38684a] break-all bg-white p-2 border rounded">
                  {quickFileHash}
                </div>
                <div className="mt-2 flex justify-end">
                  <Link href={`/verify?hash=${quickFileHash}`} className="text-[11px] font-bold text-[#002411] hover:underline flex items-center gap-1">
                    Lookup On-Chain <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Polygon Network Card */}
          <div className="bg-[#1F2023] rounded-xl border border-white/10 p-5 text-white shadow-md">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="text-xs font-semibold text-[#FFEADB] uppercase tracking-widest">Amoy Node Info</h3>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9fd2ae] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9fd2ae]"></span>
              </span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Chain ID</span>
                <span className="text-white">80002</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/50">Explorer</span>
                <a href="https://amoy.polygonscan.com" target="_blank" rel="noreferrer" className="text-[#9fd2ae] hover:underline">
                  PolygonScan Amoy
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Contract Status</span>
                <span className="text-[#FFEADB] font-bold">Ready to Deploy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
