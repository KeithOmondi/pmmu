import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchUsers, selectAllUsers, type IUser } from "../../store/slices/userSlice";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  type IIndicator,
  type IEvidence
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
} from "lucide-react";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SuperAdminRejected: React.FC = () => {
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];
  
  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const rejectedData = useMemo(() => {
    return indicators.filter((i) => {
      const isRejectedStatus = i.status === "rejected";
      const hasArchivedFiles = i.evidence?.some((e) => e.isArchived === true);
      const matchesSearch = i.indicatorTitle?.toLowerCase().includes(searchTerm.toLowerCase());
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Filtering Rejection History...</p>
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
          <h1 className="text-3xl font-black text-[#1a3a32] tracking-tighter">Rejected Indicators</h1>
          <div className="relative mt-4 w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
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
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rejection Count</p>
            <p className="text-xl font-black text-rose-600">{rejectedData.length}</p>
          </div>
          <XCircle className="text-rose-500" size={28} />
        </div>
      </div>

      {!rejectedData.length ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-20 text-center shadow-sm">
          <History className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-[#1a3a32] font-black italic">No rejection records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rejectedData.map((i) => (
            <div key={i._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-rose-200 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-black text-[#1a3a32]">{i.indicatorTitle}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase">Rejected</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                      <UserX size={10} className="text-rose-400"/> Rejected By: {getNameFromId(i.reviewedBy)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedIndicator(i)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-[#1a3a32] text-[11px] font-black uppercase rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:shadow-rose-200"
              >
                <Eye size={14} /> View Details
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

/* --- REJECTION MODAL --- */
const RejectionModal: React.FC<{ indicator: IIndicator; onClose: () => void; getNameFromId: (id: any) => string }> = ({
  indicator,
  onClose,
  getNameFromId,
}) => {
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);

  const rejectedEvidence = useMemo(() => {
    return (indicator.evidence || []).filter(e => e.isArchived);
  }, [indicator.evidence]);

  return (
    <>
      {/* Main Rejection Modal - Fixed at z-[1000] */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#1a3a32]/70 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-rose-600 p-8 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-rose-200 mb-1 font-black uppercase tracking-widest text-[10px]">
                <AlertOctagon size={14} /> Rejection Dossier
              </div>
              <h3 className="text-2xl font-black leading-tight">{indicator.indicatorTitle}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Metadata Section */}
            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-sm">
                  <UserX size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase">Rejected By</p>
                  <p className="text-sm font-bold text-[#1a3a32]">
                    {getNameFromId(indicator.reviewedBy)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-rose-400 uppercase">Rejection Date</p>
                <p className="text-sm font-bold text-[#1a3a32]">
                  {indicator.reviewedAt ? new Date(indicator.reviewedAt).toLocaleDateString() : "Pending Log"}
                </p>
              </div>
            </div>

            {/* Evidence List */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <FileText size={14} /> Failed Evidence ({rejectedEvidence.length})
              </div>
              {rejectedEvidence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rejectedEvidence.map((file) => (
                    <div key={file._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-rose-200 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={18} className="text-rose-500 shrink-0" />
                        <span className="text-xs font-bold text-gray-700 truncate">{file.fileName}</span>
                      </div>
                      <button 
                        onClick={() => setPreviewFile(file)} 
                        className="p-2 bg-white rounded-lg text-rose-600 shadow-sm hover:bg-rose-600 hover:text-white transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-2xl border border-dashed text-center font-medium italic text-gray-400 text-xs">No documents attached to this version.</div>
              )}
            </section>

            {/* Rejection Remarks */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <MessageSquare size={14} /> Reason for Rejection
              </div>
              <div className="space-y-4">
                {indicator.notes?.length > 0 ? (
                  [...indicator.notes].reverse().map((note, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-0">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-rose-500" />
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">"{note.text}"</p>
                        <div className="mt-2 text-[9px] font-bold text-gray-400 uppercase">
                          Action By: {getNameFromId(note.createdBy)} | {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center">No remarks recorded.</p>
                )}
              </div>
            </section>
          </div>

          <div className="p-6 bg-gray-50 border-t text-center">
            <button onClick={onClose} className="px-10 py-3 bg-[#1a3a32] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md">
              Close Audit
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal - Lifted to z-[1100] to sit on top of the Rejection Dossier */}
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