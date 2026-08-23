"use client";

import { useState, useEffect } from "react";
import { getCustodyLogs, createCustodyLog, CustodyLogDB } from "@/lib/supabase";

export default function CustodyLogPage() {
  const [custodyEvents, setCustodyEvents] = useState<CustodyLogDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetEvidenceId, setTargetEvidenceId] = useState("EVI-2026-9041");
  const [actionName, setActionName] = useState("Custodial Transfer Logged");
  const [fromEntity, setFromEntity] = useState("Archive Vault B");
  const [toEntity, setToEntity] = useState("District Courtroom #3");
  const [officerName, setOfficerName] = useState("Detective James Sterling");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getCustodyLogs();
      setCustodyEvents(data);
    } catch (err: any) {
      console.error("Failed to load custody logs:", err);
      setErrorMsg("Failed to load custody logs from Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fromWithOfficer = officerName ? `${fromEntity} (${officerName})` : fromEntity;

    const newLog: CustodyLogDB = {
      evidence_id: targetEvidenceId,
      action: actionName,
      from_entity: fromWithOfficer,
      to_entity: toEntity,
      tx_id: "PENDING_BLOCKCHAIN_ANCHOR",
      timestamp: new Date().toISOString(),
    };

    const { error } = await createCustodyLog(newLog);

    if (error) {
      setErrorMsg("Error creating custody log: " + error.message);
    } else {
      await loadLogs();
      setShowTransferModal(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2926] tracking-tight mb-2">Chain of Custody Audit Trail</h1>
          <p className="text-[#414942] text-sm">
            Complete, timestamped custody log tracking physical & digital evidence transfers with cryptographic proof.
          </p>
        </div>
        <button
          onClick={() => setShowTransferModal(true)}
          className="px-5 py-2.5 bg-[#002411] text-white rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-[#063b21] transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
          Log Transfer Event
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0D5] rounded-xl p-6 w-full max-w-lg shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-[#E5E0D5] pb-3">
              <h3 className="font-bold text-[#2D2926]">Log Custodial Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-[#717972] hover:text-[#2D2926]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-[#2D2926] block mb-1">Evidence ID</label>
                <input
                  type="text"
                  value={targetEvidenceId}
                  onChange={(e) => setTargetEvidenceId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fff8f2] border border-[#E5E0D5] rounded font-mono"
                  placeholder="e.g. EVI-2026-9041"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#2D2926] block mb-1">Action Description</label>
                <input
                  type="text"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fff8f2] border border-[#E5E0D5] rounded"
                  placeholder="e.g. Custodial Transfer to Court Archive"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[#2D2926] block mb-1">From Entity / Station</label>
                  <input
                    type="text"
                    value={fromEntity}
                    onChange={(e) => setFromEntity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fff8f2] border border-[#E5E0D5] rounded"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#2D2926] block mb-1">To Destination Entity</label>
                  <input
                    type="text"
                    value={toEntity}
                    onChange={(e) => setToEntity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fff8f2] border border-[#E5E0D5] rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#2D2926] block mb-1">Authorizing Officer / User</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fff8f2] border border-[#E5E0D5] rounded"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 border border-[#E5E0D5] rounded font-semibold text-[#2D2926] hover:bg-[#efe7de]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#002411] text-white rounded font-semibold hover:bg-[#063b21] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      Logging...
                    </>
                  ) : (
                    "Record Transfer Event"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custody Log Timeline */}
      <div className="bg-white border border-[#E5E0D5] rounded-xl shadow-sm overflow-hidden p-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#717972]">
            <span className="material-symbols-outlined animate-spin text-[24px] mb-2 block">sync</span>
            Querying live custody logs from Supabase...
          </div>
        ) : custodyEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#717972] flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[#c1baa8]">history_toggle_off</span>
            <div>
              <p className="font-semibold text-[#2D2926] text-sm">No Custody Logs Registered Yet</p>
              <p className="mt-1">Log a custodial transfer event or upload evidence to record historical entries.</p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="mt-2 px-4 py-2 bg-[#002411] text-white rounded text-xs font-semibold uppercase tracking-wider"
            >
              Log First Custody Transfer
            </button>
          </div>
        ) : (
          <div className="relative before:absolute before:inset-y-0 before:left-[21px] before:w-[2px] before:bg-[#E5E0D5] flex flex-col gap-6">
            {custodyEvents.map((evt) => (
              <div key={evt.id || evt.timestamp} className="relative pl-12">
                <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-[#f3dfd0] flex items-center justify-center border-4 border-white z-10 text-[#241911]">
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </div>

                <div className="bg-[#fff8f2] border border-[#E5E0D5] rounded-lg p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#002411] bg-[#baefc9] px-2 py-0.5 rounded mr-2">
                        {evt.evidence_id}
                      </span>
                      <span className="font-semibold text-[#2D2926] text-sm">{evt.action}</span>
                    </div>
                    <span className="font-mono text-xs text-[#717972]">
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : "Just now"}
                    </span>
                  </div>

                  <div className="text-xs text-[#414942] my-2">
                    <span className="font-semibold text-[#2D2926]">{evt.from_entity}</span>
                    <span className="mx-2 text-[#717972]">→</span>
                    <span className="font-semibold text-[#2D2926]">{evt.to_entity}</span>
                  </div>

                  <div className="bg-[#f4ede4] p-3 rounded border border-[#E5E0D5] flex justify-between items-center text-xs font-mono mt-3">
                    <span className="text-[#414942]">
                      Reference: <strong className="text-[#2D2926]">{evt.tx_id || "STORAGE_RECORD"}</strong>
                    </span>
                    <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase">
                      ON-CHAIN: PENDING
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
