"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getEvidenceRecord, getCustodyLogs, EvidenceRecordDB, CustodyLogDB } from "@/lib/supabase";

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialHash = searchParams?.get("hash") || searchParams?.get("id") || "";

  const [searchQuery, setSearchQuery] = useState(initialHash || "");
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [computedFileHash, setComputedFileHash] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<EvidenceRecordDB | null>(null);
  const [custodyHistory, setCustodyHistory] = useState<CustodyLogDB[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certTimestamp, setCertTimestamp] = useState<string>("");

  useEffect(() => {
    if (initialHash) {
      handleLookup(initialHash);
    }
  }, [initialHash]);

  const handleFileDrop = async (file: File) => {
    setVerifyFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setComputedFileHash(hashHex);
  };

  const handleLookup = async (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setNotFound(false);

    try {
      const record = await getEvidenceRecord(q);
      if (record) {
        setResult(record);
        // Fetch custody logs for this evidence record
        const logs = await getCustodyLogs(record.evidence_id);
        setCustodyHistory(logs);
      } else {
        setResult(null);
        setNotFound(true);
        setCustodyHistory([]);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const openCertificate = async () => {
    if (result) {
      const logs = await getCustodyLogs(result.evidence_id);
      setCustodyHistory(logs);
      setCertTimestamp(new Date().toUTCString());
      setShowCertificateModal(true);
    }
  };

  const isHashMatch =
    result &&
    computedFileHash &&
    computedFileHash.toLowerCase() === result.evidence_hash.toLowerCase() &&
    !simulateTamper;

  const isHashMismatched =
    result &&
    computedFileHash &&
    (computedFileHash.toLowerCase() !== result.evidence_hash.toLowerCase() || simulateTamper);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
      {/* Hide standard UI elements when printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-certificate, #print-certificate * {
            visibility: visible;
          }
          #print-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <h1 className="text-3xl font-bold text-[#2D2926] tracking-tight mb-2">Evidence Verification & Hash Audit</h1>
        <p className="text-[#414942] text-sm">
          Verify digital evidence payloads against registered cryptographic SHA-256 hashes to detect tampering or alterations.
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="no-print bg-white border border-[#E5E0D5] rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <label className="text-xs font-semibold text-[#414942] uppercase tracking-widest block">
          Enter Evidence ID or Cryptographic SHA-256 Hash
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. EVI-2026-9041 or 0x8f3c7a..."
            className="flex-1 px-4 py-3 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg font-mono text-xs text-[#2D2926] focus:outline-none focus:border-[#38684a]"
          />
          <button
            onClick={() => handleLookup()}
            disabled={isSearching}
            className="px-6 py-3 bg-[#002411] text-white rounded-lg font-semibold text-xs uppercase tracking-widest hover:bg-[#063b21] transition-colors shadow-sm flex items-center gap-2"
          >
            {isSearching ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">search</span>
            )}
            Verify Record
          </button>
        </div>
      </div>

      {notFound && (
        <div className="no-print p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">search_off</span>
          <span>No registered evidence record found for query: <strong className="font-mono">{searchQuery}</strong></span>
        </div>
      )}

      {/* Verification Result View */}
      {result && (
        <div className="no-print flex flex-col gap-6">
          {/* Certificate Export Banner */}
          <div className="bg-[#002411] text-white rounded-xl p-5 shadow-md flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-[#FFEADB] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">verified</span>
                Legal Audit Proof Certificate Available
              </h3>
              <p className="text-xs text-white/70 mt-1">
                Generate a formal, printable PDF forensic proof certificate for legal compliance and court audit.
              </p>
            </div>
            <button
              onClick={openCertificate}
              className="px-5 py-2.5 bg-[#FFEADB] text-[#002411] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white transition flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              Export Forensic Proof Certificate
            </button>
          </div>

          {/* File Re-hash & Compare Dropzone */}
          <div className="bg-white border border-[#E5E0D5] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-semibold text-[#414942] uppercase tracking-widest">
                Upload Local File Payload to Compare Integrity
              </label>

              {/* Demo Tamper Toggle */}
              <button
                onClick={() => setSimulateTamper(!simulateTamper)}
                className={`text-[11px] font-mono px-3 py-1 rounded border transition-colors ${
                  simulateTamper
                    ? "bg-[#ffdad6] text-[#ba1a1a] border-[#C34A36]"
                    : "bg-[#fff8f2] text-[#717972] border-[#E5E0D5] hover:bg-[#efe7de]"
                }`}
              >
                {simulateTamper ? "Simulating Tampered Payload" : "Simulate Tamper Alert"}
              </button>
            </div>

            <label className="w-full h-32 border-2 border-dashed border-[#E5E0D5] rounded-lg flex flex-col items-center justify-center bg-[#faf2e9] hover:bg-[#efe7de] transition-colors cursor-pointer p-4 text-center">
              <input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleFileDrop(e.target.files[0])}
                className="hidden"
              />
              <span className="material-symbols-outlined text-3xl text-[#717972] mb-1">upload_file</span>
              <span className="text-xs font-semibold text-[#2D2926]">
                {verifyFile ? verifyFile.name : "Drop file here to compare SHA-256 against registered record"}
              </span>
              <span className="text-[10px] text-[#717972] mt-1">Computes local SHA-256 and checks match</span>
            </label>

            {computedFileHash && (
              <div className="mt-4 p-3 bg-[#fff8f2] border border-[#E5E0D5] rounded-lg text-xs font-mono">
                <span className="text-[#717972] block text-[10px] uppercase">Calculated File SHA-256 Digest:</span>
                <span className="text-[#2D2926] break-all font-semibold">{computedFileHash}</span>
              </div>
            )}
          </div>

          {/* Result Card: Integrity Confirmed vs Tamper Alert */}
          {isHashMismatched ? (
            /* TAMPER ALERT SCREEN */
            <div className="bg-[#ffdad6]/40 border-2 border-[#C34A36] rounded-xl p-6 shadow-md flex flex-col gap-4">
              <div className="flex items-center gap-3 text-[#ba1a1a]">
                <div className="p-3 bg-[#ffdad6] rounded-lg">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wider">CRITICAL TAMPER WARNING DETECTED</h2>
                  <p className="text-xs text-[#2D2926]">
                    The uploaded file&apos;s calculated SHA-256 hash does NOT match the registered evidence record.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#C34A36]/30 font-mono text-xs space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[#717972]">Registered Hash:</span>
                  <span className="text-[#38684a] font-bold break-all">{result.evidence_hash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717972]">Uploaded File Hash:</span>
                  <span className="text-[#ba1a1a] font-bold break-all">
                    {simulateTamper
                      ? "0x8f3c7a9e1d2b4f6a0c8e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f"
                      : computedFileHash}
                  </span>
                </div>
              </div>
            </div>
          ) : isHashMatch ? (
            /* INTEGRITY CONFIRMED SCREEN */
            <div className="bg-white border border-[#38684a] rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#baefc9] text-[#00210f] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#2D2926]">Integrity Verified & Confirmed</h2>
                    <p className="text-xs text-[#38684a]">File SHA-256 matches registered database record 100%</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-[#baefc9] text-[#00210f] px-3 py-1 rounded-full uppercase">
                  MATCH CONFIRMED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5]">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Evidence ID</span>
                  <span className="font-bold text-[#2D2926] text-sm">{result.evidence_id}</span>
                </div>

                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5]">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Record Status</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] uppercase">
                    {result.status}
                  </span>
                </div>

                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5] md:col-span-2">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Submitter Metadata</span>
                  <span className="text-[#2D2926] break-all">{result.submitter_address}</span>
                </div>

                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5] md:col-span-2">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Registered SHA-256 Digest</span>
                  <span className="text-[#38684a] font-bold break-all">{result.evidence_hash}</span>
                </div>
              </div>
            </div>
          ) : (
            /* RECORD DETAILS VIEW (BEFORE DROP) */
            <div className="bg-white border border-[#E5E0D5] rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#2D2926]">Registered Evidence Details</h2>
                  <p className="text-xs text-[#717972]">Drop the original file above to run full SHA-256 verification</p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full uppercase">
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5]">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Evidence ID</span>
                  <span className="font-bold text-[#2D2926] text-sm">{result.evidence_id}</span>
                </div>

                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5]">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Payload File Name</span>
                  <span className="font-bold text-[#2D2926] text-xs truncate block">{result.file_name}</span>
                </div>

                <div className="bg-[#fff8f2] p-4 rounded-lg border border-[#E5E0D5] md:col-span-2">
                  <span className="text-[#717972] text-[10px] uppercase block mb-1">Registered SHA-256 Digest</span>
                  <span className="text-[#38684a] font-bold break-all">{result.evidence_hash}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Forensic Proof Certificate Modal / Container */}
      {showCertificateModal && result && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-black border-4 border-[#002411] rounded-2xl w-full max-w-3xl p-8 shadow-2xl flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Controls (Hidden during print) */}
            <div className="no-print flex justify-between items-center border-b pb-4 border-gray-200">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#002411]">
                <span className="material-symbols-outlined">workspace_premium</span>
                Legal Audit Proof Certificate Preview
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#002411] text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-[#063b21] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-3 py-2 border border-gray-300 rounded font-semibold text-xs hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Target Certificate Container */}
            <div id="print-certificate" className="flex flex-col gap-6 bg-white p-2">
              {/* Header */}
              <div className="border-b-2 border-[#002411] pb-4 flex justify-between items-start">
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#38684a]">
                    LEGITICHAIN FORENSIC AUDIT SYSTEM
                  </div>
                  <h1 className="text-xl font-bold text-[#002411] tracking-tight uppercase mt-1">
                    Certificate of Cryptographic Authenticity & Custody
                  </h1>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Formal legal proof report issued for digital evidence payload audit compliance.
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-gray-500">
                  <div>Cert ID: <strong className="text-black">CERT-{result.evidence_id}</strong></div>
                  <div>Issued: {certTimestamp}</div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-[#faf2e9] border border-[#E5E0D5] flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-gray-500 uppercase text-[10px] block">Cryptographic Verification Status</span>
                  <span className="font-bold text-emerald-800 text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    {isHashMatch
                      ? "100% MATCH CONFIRMED - CRYPTOGRAPHICALLY AUTHENTIC"
                      : isHashMismatched
                      ? "CRITICAL TAMPER WARNING DETECTED"
                      : "REGISTERED DATABASE AUDIT RECORD"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 uppercase text-[10px] block">Evidence Status</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] uppercase">
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Payload Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <span className="text-gray-500 text-[10px] uppercase block">Evidence ID</span>
                  <span className="font-bold text-black">{result.evidence_id}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <span className="text-gray-500 text-[10px] uppercase block">Payload File Name</span>
                  <span className="font-bold text-black truncate block">{result.file_name}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 col-span-2">
                  <span className="text-gray-500 text-[10px] uppercase block">Registered SHA-256 Digest</span>
                  <span className="font-bold text-[#002411] break-all">{result.evidence_hash}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 col-span-2">
                  <span className="text-gray-500 text-[10px] uppercase block">Submitter Identity & Role</span>
                  <span className="font-semibold text-black break-all">{result.submitter_address}</span>
                </div>
              </div>

              {/* Chain of Custody Timeline Table */}
              <div>
                <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-[#002411] mb-2 border-b pb-1">
                  Historical Chain of Custody Audit Trail ({custodyHistory.length} Events)
                </h3>
                {custodyHistory.length === 0 ? (
                  <p className="text-xs text-gray-500 italic font-mono">No transfer events recorded for this evidence item.</p>
                ) : (
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-gray-100 border-b border-gray-200 text-gray-700">
                        <tr>
                          <th className="p-2 font-semibold">Action</th>
                          <th className="p-2 font-semibold">From</th>
                          <th className="p-2 font-semibold">To</th>
                          <th className="p-2 font-semibold">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {custodyHistory.map((evt, i) => (
                          <tr key={evt.id || i} className="hover:bg-gray-50">
                            <td className="p-2 font-bold text-[#002411]">{evt.action}</td>
                            <td className="p-2 text-gray-700">{evt.from_entity}</td>
                            <td className="p-2 text-gray-700">{evt.to_entity}</td>
                            <td className="p-2 text-gray-500">{evt.timestamp ? new Date(evt.timestamp).toLocaleDateString() : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Blockchain Anchor Status Box */}
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-xs font-mono">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-900 uppercase">On-Chain Blockchain Anchor Status</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px] uppercase">
                    PENDING DEPLOYMENT
                  </span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  <strong>Note for Legal Audit:</strong> Smart contract on Polygon Amoy testnet is pending deployment faucet funding. The SHA-256 cryptographic digest is currently secured & verified in the immutable database audit trail.
                </p>
                <div className="mt-2 text-[10px] text-amber-700">
                  Contract Address Placeholder: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">0x9f2a1b7e4c8d301f2e5b6a7c8d9e0f1a2b3c4d5e</span>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="mt-4 border-t pt-4 flex justify-between items-end text-[10px] font-mono text-gray-500">
                <div>
                  <div>LegitiChain Forensic Verification Node</div>
                  <div>SHA-256 Engine Version: WebCrypto v4.2</div>
                </div>
                <div className="text-center border-t border-gray-400 pt-1 w-48 text-black font-semibold">
                  Authorized Forensic Examiner
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidenceVerificationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading verification module...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
