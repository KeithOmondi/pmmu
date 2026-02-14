import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUsers,
  selectAllUsers,
  type IUser,
} from "../../store/slices/userSlice";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  type IIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  Eye,
  XCircle,
  AlertOctagon,
  History,
  UserX,
  X,
  FileText,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SuperAdminRejected: React.FC = () => {
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];

  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const rejectedData = useMemo(() => {
    return indicators.filter((i) => {
      const isRejectedStatus = i.status === "rejected";
      const hasArchivedFiles = i.evidence?.some((e) => e.isArchived === true);
      const matchesSearch = i.indicatorTitle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return (isRejectedStatus || hasArchivedFiles) && matchesSearch;
    });
  }, [indicators, searchTerm]);

  const getNameFromId = (input: any): string => {
    if (!input) return "System Admin";
    const idToLookup = typeof input === "string" ? input : input._id;
    const found = allUsers.find((u) => u._id === idToLookup);
    return found ? found.name : "Internal Auditor";
  };

  if (loading && indicators.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-[#1a3a32]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#c2a336]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Accessing Rejection Archives...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa]">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-2 font-black uppercase tracking-[0.2em] text-[10px]">
            <AlertOctagon size={14} /> Compliance Audit
          </div>
          <h1 className="text-3xl font-black text-[#1a3a32] tracking-tighter">
            Rejected Indicators
          </h1>
          <div className="relative mt-4 w-full max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search by title..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white px-6 py-4 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Rejection Count
            </p>
            <p className="text-xl font-black text-rose-600">
              {rejectedData.length}
            </p>
          </div>
          <XCircle className="text-rose-500" size={28} />
        </div>
      </div>

      {!rejectedData.length ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-20 text-center shadow-sm">
          <History className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-[#1a3a32] font-black italic">
            No rejection records found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rejectedData.map((i) => (
            <div
              key={i._id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-rose-200 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-black text-[#1a3a32]">
                    {i.indicatorTitle}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase">
                      Rejected
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                      <UserX size={10} className="text-rose-400" /> Rejected By:{" "}
                      {getNameFromId(i.reviewedBy)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedIndicator(i)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-[#1a3a32] text-[11px] font-black uppercase rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <Eye size={14} /> Audit Dossier
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedIndicator && (
        <RejectionModal
          indicator={selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          getNameFromId={getNameFromId}
        />
      )}
    </div>
  );
};

/* --- ENHANCED REJECTION MODAL --- */
const RejectionModal: React.FC<{
  indicator: IIndicator;
  onClose: () => void;
  getNameFromId: (id: any) => string;
}> = ({ indicator, onClose, getNameFromId }) => {
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);

  const archivedEvidence = useMemo(() => {
    return (indicator.evidence || []).filter((e) => e.isArchived);
  }, [indicator.evidence]);

  const activeEvidence = useMemo(() => {
    return (indicator.evidence || []).filter((e) => !e.isArchived);
  }, [indicator.evidence]);

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-[#1a3a32]/70 backdrop-blur-md"
          onClick={onClose}
        />
        <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-rose-600 p-8 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-rose-200 mb-1 font-black uppercase tracking-widest text-[10px]">
                <AlertOctagon size={14} /> Rejection Dossier & Evidence Audit
              </div>
              <h3 className="text-2xl font-black leading-tight">
                {indicator.indicatorTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
            {/* AUDIT METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-sm">
                  <UserX size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase">
                    Reviewing Officer
                  </p>
                  <p className="text-sm font-bold text-[#1a3a32]">
                    {getNameFromId(indicator.reviewedBy)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white shadow-sm">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Audit Timestamp
                  </p>
                  <p className="text-sm font-bold text-[#1a3a32]">
                    {indicator.reviewedAt
                      ? new Date(indicator.reviewedAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Manual Override"}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIVE EVIDENCE (NEW UPLOADS) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Active Submissions (
                  {activeEvidence.length})
                </div>
                <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                  Current Version
                </span>
              </div>

              {activeEvidence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeEvidence.map((file) => (
                    <div
                      key={file._id}
                      className="flex flex-col p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 group transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText
                            size={18}
                            className="text-emerald-500 shrink-0"
                          />
                          <span className="text-xs font-bold text-gray-700 truncate">
                            {file.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-white/50 w-fit px-2 py-1 rounded-md">
                        <User size={10} /> Uploaded By:{" "}
                        {getNameFromId(file.uploadedBy)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-2xl border border-dashed text-center font-medium italic text-gray-400 text-xs">
                  No active files currently found.
                </div>
              )}
            </section>

            {/* ARCHIVED EVIDENCE (FAILED HISTORY) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  <History size={14} /> Rejected Archives (
                  {archivedEvidence.length})
                </div>
                <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                  Archived
                </span>
              </div>

              {archivedEvidence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-90">
                  {archivedEvidence.map((file) => (
                    <div
                      key={file._id}
                      className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-rose-200 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText
                            size={18}
                            className="text-rose-400 shrink-0"
                          />
                          <span className="text-xs font-bold text-gray-400 truncate italic">
                            {file.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 bg-white rounded-lg text-rose-400 shadow-sm hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold bg-white/50 w-fit px-2 py-1 rounded-md">
                        <User size={10} /> Uploaded By:{" "}
                        {getNameFromId(file.uploadedBy)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-2xl border border-dashed text-center font-medium italic text-gray-400 text-xs">
                  No previous archives found.
                </div>
              )}
            </section>

            {/* REJECTION HISTORY / REMARKS */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <MessageSquare size={14} /> Rejection Narrative
              </div>
              <div className="space-y-4">
                {indicator.notes?.length > 0 ? (
                  [...indicator.notes].reverse().map((note, idx) => (
                    <div
                      key={idx}
                      className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0"
                    >
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-rose-500 shadow-sm" />
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                          "{note.text}"
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
                          <span>By: {getNameFromId(note.createdBy)}</span>
                          <span>
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center">
                    No official remarks recorded for this rejection.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="p-6 bg-gray-50 border-t text-center">
            <button
              onClick={onClose}
              className="px-10 py-3 bg-[#1a3a32] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md"
            >
              Terminate Audit View
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal Overlay */}
      {previewFile && (
        <div className="relative z-[1100]">
          <EvidencePreviewModal
            file={previewFile}
            indicatorId={indicator._id}
            onClose={() => setPreviewFile(null)}
          />
        </div>
      )}
    </>
  );
};

export default SuperAdminRejected;
