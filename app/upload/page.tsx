"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { uploadEvidenceFile, createEvidenceRecord, createCustodyLog } from "@/lib/supabase";

export default function EvidenceUploadPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [evidenceId, setEvidenceId] = useState(`EVI-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [category, setCategory] = useState("Forensic Disk Image");
  const [description, setDescription] = useState("");
  const [computedHash, setComputedHash] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Client-side SHA-256 computation using Web Crypto API
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      setComputedHash(hashHex);
    } catch (err: any) {
      setErrorMsg("Failed to compute SHA-256 hash: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !computedHash) return;

    if (!user || !profile) {
      setErrorMsg("Authentication required. Please sign in before uploading evidence.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Upload raw payload to Supabase Storage
      const { path: storagePath, publicUrl, error: storageErr } = await uploadEvidenceFile(file, evidenceId);
      
      if (storageErr) {
        throw new Error(`Storage Error: ${storageErr.message}`);
      }

      const submitterInfo = `${profile.full_name} (${profile.role} @ ${profile.organization})`;

      // 2. Insert record into Supabase evidence_records table
      const { data: dbData, error: dbErr } = await createEvidenceRecord({
        evidence_id: evidenceId,
        evidence_hash: computedHash,
        file_name: file.name,
        file_size: file.size,
        file_type: category || file.type || "binary",
        submitter_address: submitterInfo,
        status: "PENDING",
      });

      if (dbErr) {
        throw new Error(`Database Error: ${dbErr.message}`);
      }

      // 3. Log event in custody_logs table
      await createCustodyLog({
        evidence_id: evidenceId,
        action: "EVIDENCE_UPLOADED_TO_STORAGE",
        from_entity: profile.full_name,
        to_entity: "Supabase Secure Storage",
        tx_id: storagePath,
      });

      // 4. Render success receipt
      setUploadResult({
        evidenceId,
        evidenceHash: computedHash,
        fileName: file.name,
        fileSize: file.size,
        category,
        submitter: submitterInfo,
        storagePath,
        publicUrl,
        timestamp: new Date().toISOString(),
        status: "PENDING",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed due to policy or network error.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-xs font-mono text-[#717972]">
        <span className="material-symbols-outlined animate-spin text-[24px] mb-2 block">sync</span>
        Validating user session & role privileges...
      </div>
    );
  }

  // Enforce Authentication
  if (!user || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-[#1F2023] border border-white/10 rounded-2xl p-8 text-white text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-300">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Authentication Required</h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            You must be signed in with an authorized institutional role (<span className="text-[#9fd2ae] font-semibold font-mono">INVESTIGATOR</span>, <span className="text-[#9fd2ae] font-semibold font-mono">FORENSIC_EXPERT</span>, or <span className="text-[#9fd2ae] font-semibold font-mono">ADMIN</span>) to upload evidence payload files and register cryptographic hashes.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-[#FFEADB] text-[#1F2023] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-white transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign In or Register Role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1F2023] border border-white/10 rounded-full text-[#FFEADB] text-xs font-mono mb-2">
          <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
          Authenticated: <strong className="text-white">{profile.full_name}</strong> ({profile.role})
        </div>
        <h1 className="text-3xl font-bold text-[#2D2926] tracking-tight mb-2">
          Upload Evidence & Compute SHA-256 Hash
        </h1>
        <p className="text-[#414942] text-sm">
          Compute client-side cryptographic SHA-256 hashes, store secure payloads in Supabase Storage, and register evidence records.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {!uploadResult ? (
        <form onSubmit={handleUploadAndSave} className="flex flex-col gap-6">
          {/* File Upload Section */}
          <div className="bg-white border border-[#E5E0D5] rounded-xl p-6 shadow-sm">
            <label className="text-xs font-semibold text-[#414942] uppercase tracking-widest block mb-4">
              1. Select Digital Evidence Payload File
            </label>

            <div className="w-full h-44 border-2 border-dashed border-[#E5E0D5] rounded-lg flex flex-col items-center justify-center bg-[#faf2e9] hover:bg-[#efe7de] transition-colors cursor-pointer p-6 relative">
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required={!file}
              />
              <span className="material-symbols-outlined text-4xl text-[#38684a] mb-2">cloud_upload</span>
              {file ? (
                <div className="text-center">
                  <span className="font-semibold text-[#2D2926] block text-sm">{file.name}</span>
                  <span className="text-xs text-[#717972]">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="font-semibold text-[#2D2926] text-sm block">Click or Drag & Drop File</span>
                  <span className="text-xs text-[#717972]">Disk images, PCAP traces, video files, audio, or archives</span>
                </div>
              )}
            </div>

            {/* Real-time Hash Output */}
            {computedHash && (
              <div className="mt-4 p-4 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg">
                <div className="flex items-center justify-between text-xs font-semibold text-[#414942] uppercase tracking-wider mb-2">
                  <span>Client-Side SHA-256 Digest</span>
                  <span className="text-[#38684a] font-mono text-[10px] bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    WebCrypto Verified
                  </span>
                </div>
                <div className="font-mono text-xs text-[#38684a] font-bold break-all bg-white p-3 border rounded shadow-inner">
                  {computedHash}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="bg-white border border-[#E5E0D5] rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <label className="text-xs font-semibold text-[#414942] uppercase tracking-widest block mb-2">
              2. Evidence Metadata & Provenance
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#2D2926] block mb-1">Unique Evidence ID</label>
                <input
                  type="text"
                  value={evidenceId}
                  onChange={(e) => setEvidenceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg font-mono text-xs text-[#2D2926] focus:outline-none focus:border-[#38684a]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2926] block mb-1">Submitter Identity</label>
                <input
                  type="text"
                  readOnly
                  value={`${profile.full_name} (${profile.organization})`}
                  className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#E5E0D5] rounded-lg font-mono text-xs text-gray-700 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#2D2926] block mb-1">Evidence Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg text-xs text-[#2D2926] focus:outline-none focus:border-[#38684a]"
                >
                  <option>Forensic Disk Image</option>
                  <option>Network Packet Capture (.pcap)</option>
                  <option>CCTV / Surveillance Video</option>
                  <option>Financial Record Archive</option>
                  <option>Legal Affidavit & Contract</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2926] block mb-1">Case / Reference Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Case #2026-FL-08"
                  className="w-full px-3.5 py-2.5 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg text-xs text-[#2D2926] focus:outline-none focus:border-[#38684a]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D2926] block mb-1">Custody & Seizure Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hardware serial numbers, seizure location, custody chain details..."
                className="w-full px-3.5 py-2.5 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg text-xs text-[#2D2926] focus:outline-none focus:border-[#38684a]"
              />
            </div>
          </div>

          {/* Submission Button */}
          <button
            type="submit"
            disabled={!file || isProcessing}
            className="w-full py-4 bg-[#002411] text-white rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-[#063b21] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                Uploading Payload & Registering Hash...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                Upload Payload & Register Evidence Record
              </>
            )}
          </button>
        </form>
      ) : (
        /* Success Receipt View */
        <div className="bg-white border border-[#38684a] rounded-xl p-8 shadow-md flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-[#E5E0D5] pb-6">
            <div className="w-12 h-12 rounded-full bg-[#baefc9] text-[#00210f] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D2926]">Evidence Payload Uploaded & Registered!</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[10px] font-mono font-bold">
                  STATUS: PENDING ANCHOR
                </span>
                <span className="text-xs text-[#717972] font-mono">{uploadResult.timestamp}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs bg-[#fff8f2] p-5 rounded-lg border border-[#E5E0D5]">
            <div className="flex justify-between border-b border-[#E5E0D5] pb-2">
              <span className="text-[#717972]">Evidence ID:</span>
              <span className="font-bold text-[#2D2926]">{uploadResult.evidenceId}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E0D5] pb-2">
              <span className="text-[#717972]">File Payload:</span>
              <span className="text-[#2D2926] font-semibold">{uploadResult.fileName} ({(uploadResult.fileSize / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E0D5] pb-2">
              <span className="text-[#717972]">Submitter Identity:</span>
              <span className="text-[#2D2926] break-all">{uploadResult.submitter}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E0D5] pb-2">
              <span className="text-[#717972]">Computed SHA-256:</span>
              <span className="text-[#38684a] font-bold break-all">{uploadResult.evidenceHash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717972]">Storage Path:</span>
              <span className="text-[#002411] break-all">{uploadResult.storagePath}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setUploadResult(null);
                setFile(null);
                setComputedHash(null);
                setEvidenceId(`EVI-2026-${Math.floor(1000 + Math.random() * 9000)}`);
              }}
              className="flex-1 py-3 border border-[#E5E0D5] rounded-lg font-semibold text-xs uppercase tracking-widest text-[#2D2926] hover:bg-[#efe7de] transition-colors"
            >
              Upload Another Evidence
            </button>
            <Link
              href="/custody"
              className="flex-1 py-3 bg-[#002411] text-white text-center rounded-lg font-semibold text-xs uppercase tracking-widest hover:bg-[#063b21] transition-colors flex items-center justify-center gap-2"
            >
              View Custody Timeline
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
