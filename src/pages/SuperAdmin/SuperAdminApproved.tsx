// src/pages/Admin/SuperAdminApproved.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  updateIndicator,
  type IIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Gavel,
  X,
  FileText,
  Database,
  AlertCircle,
  Lock,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchUsers,
  selectAllUsers,
  type IUser,
} from "../../store/slices/userSlice";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

/* ===================================== HELPERS ===================================== */
const formatDuration = (ms: number) => {
  const abs = Math.max(0, Math.abs(ms));
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.length > 0 ? parts.join(" ") : "0m";
};

/* ===================================== MAIN COMPONENT ===================================== */
const SuperAdminApproved: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector((state) => state.indicators.allIndicators);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const reviewIndicators = useMemo(() => {
    return [...indicators]
      .filter((i) => (i.status === "approved" || i.status === "completed") && 
              i.indicatorTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.indicatorTitle.localeCompare(b.indicatorTitle));
  }, [indicators, searchTerm]);

  const getAssignedName = (indicator: IIndicator) => {
    if (indicator.assignedToType === "group") return "Department Group";
    const assignedData = indicator.assignedTo;
    if (!assignedData) return "Unassigned";
    if (typeof assignedData === "object" && assignedData !== null)
      return (assignedData as any).name || "Unknown User";
    const foundUser = allUsers.find((u) => u._id === assignedData);
    return foundUser ? foundUser.name : "System User";
  };

  const handleReview = async (indicator: IIndicator, approve: boolean) => {
    try {
      setProcessingId(indicator._id);
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: {
            status: approve ? "completed" : "approved",
            reviewedAt: new Date().toISOString(),
          },
        })
      ).unwrap();

      toast.success(approve ? "Protocol Ratified & Locked" : "Returned for Further Review");
      setSelectedIndicator(null);
    } catch (err: any) {
      toast.error(err || "Registry Update Failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans">
      {/* COMMAND HEADER */}
      <header className="bg-[#1a3a32] text-white pt-12 pb-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#c2a336]">
              <Gavel size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Authorization Terminal</span>
            </div>
            <h1 className="text-4xl font-serif font-black tracking-tight">Registry Approval Queue</h1>
            <p className="text-white/60 text-sm max-w-md">Final executive review and sealing of compliance protocols into the master ledger.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="block text-[10px] font-black text-[#c2a336] uppercase tracking-widest mb-1">Queue Depth</span>
              <span className="text-4xl font-mono font-bold">{reviewIndicators.length}</span>
            </div>
            <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
            <div className="relative group hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
               <input 
                type="text"
                placeholder="Search Registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:bg-white/10 outline-none transition-all w-64"
               />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-12 -mt-10 pb-20">
        <div className="grid grid-cols-1 gap-4">
          {reviewIndicators.length > 0 ? (
            reviewIndicators.map((i) => (
              <div
                key={i._id}
                className={`group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-xl hover:border-[#c2a336]/30 ${
                  i.status === "completed" ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    i.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400 group-hover:bg-[#1a3a32] group-hover:text-[#c2a336]"
                  } transition-colors`}>
                    {i.status === "completed" ? <Lock size={20} /> : <FileText size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#1a3a32] truncate pr-4">{i.indicatorTitle}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{i.category?.title || "Standard"}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-[#c2a336]">{getAssignedName(i)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedIndicator(i)}
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1a3a32] transition-colors"
                  >
                    <Eye size={14} /> Inspect
                  </button>
                  <button
                    disabled={!!processingId || i.status === "completed"}
                    onClick={() => handleReview(i, true)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      i.status === "completed" 
                      ? "bg-slate-100 text-slate-400 border border-slate-200" 
                      : "bg-[#1a3a32] text-[#c2a336] hover:bg-[#c2a336] hover:text-[#1a3a32] shadow-lg shadow-slate-200"
                    }`}
                  >
                    {processingId === i._id ? <Loader2 size={14} className="animate-spin" /> : i.status === "completed" ? "Sealed" : "Ratify Entry"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <Database size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Clearance Queue Empty</p>
            </div>
          )}
        </div>
      </main>

      {/* AUDIT MODAL */}
      {selectedIndicator && (
        <AuditModal
          indicator={selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          onReview={handleReview}
          processingId={processingId}
          assignedName={getAssignedName(selectedIndicator)}
        />
      )}
    </div>
  );
};

/* --- AUDIT MODAL COMPONENT (Dossier Aesthetic + Fixed Date Logic) --- */
const AuditModal = ({
  indicator,
  onClose,
  onReview,
  processingId,
  assignedName,
}: {
  indicator: IIndicator;
  onClose: () => void;
  onReview: (indicator: IIndicator, approve: boolean) => void;
  processingId: string | null;
  assignedName: string;
}) => {
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);

  const compliance = useMemo(() => {
    // 1. Check for basic requirements
    if (!indicator.evidence?.length || !indicator.dueDate) {
      return { status: "none", label: "Registry Data Missing" };
    }

    const dueTime = new Date(indicator.dueDate).getTime();
    
    // 2. Extract timestamps with fallbacks for different property names
    const submissionTimes = indicator.evidence
      .map((e: any) => {
        const timestamp = e.createdAt || e.uploadedAt;
        return timestamp ? new Date(timestamp).getTime() : NaN;
      })
      .filter((t: number) => !isNaN(t))
      .sort((a: number, b: number) => a - b);

    if (submissionTimes.length === 0) {
      return { status: "none", label: "No Timestamp Found" };
    }

    // 3. Calculation
    const diff = dueTime - submissionTimes[0];
    const isEarly = diff >= 0;

    return {
      status: "calculated",
      early: isEarly,
      label: formatDuration(diff),
    };
  }, [indicator]);

  return (
    <>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-[#020817]/95 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

        <div className="relative bg-white w-full max-w-5xl h-full sm:h-[85vh] rounded-none sm:rounded-[1.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.4)] flex flex-col md:flex-row transition-all animate-in slide-in-from-bottom-10 duration-500 text-[#1a3a32]">
          
          {/* DOSSIER SIDEBAR */}
          <aside className="w-full md:w-[340px] bg-[#0f172a] text-slate-300 p-8 flex flex-col border-r border-white/5 shrink-0">
            <div className="mb-10">
              <div className="flex items-center gap-2 text-[#c2a336] mb-4">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Security Dossier</span>
              </div>
              <h3 className="text-2xl font-bold text-white leading-tight mb-2">{indicator.indicatorTitle}</h3>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">REF: {indicator._id.slice(-12).toUpperCase()}</p>
            </div>

            <div className="space-y-8 flex-1">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Sumitted By:</label>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-[#c2a336] flex items-center justify-center text-[#1a3a32] font-bold text-xs uppercase">
                        {assignedName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-white">{assignedName}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Analysis</label>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                    <div>
                        <span className="block text-[8px] text-slate-500 uppercase tracking-widest mb-1">Compliance Status</span>
                        {compliance.status === "none" ? (
                             <span className="text-xs font-mono text-slate-400 italic">{compliance.label}</span>
                        ) : (
                            <div className="flex flex-col">
                                <span className={`text-sm font-mono font-bold ${compliance.early ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {compliance.early ? 'COMPLIANT' : 'OVERDUE'}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1 font-mono italic">
                                    {compliance.early ? `Submitted ${compliance.label} early` : `Late by ${compliance.label}`}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="h-[1px] bg-white/5 w-full" />
                    <div>
                        <span className="block text-[8px] text-slate-500 uppercase tracking-widest mb-1">Approval Phase</span>
                        <span className="text-xs font-mono text-white flex items-center gap-2">
                           <CheckCircle2 size={12} className="text-[#c2a336]" /> Awaiting Final Seal
                        </span>
                    </div>
                </div>
              </div>

              <div className="mt-auto py-4 border-t border-white/5">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#c2a336]">
                        <div className="w-2 h-2 rounded-full bg-[#c2a336] animate-pulse" />
                        Live Status: {indicator.status}
                    </div>
                 </div>
              </div>
            </div>
          </aside>

          {/* LEDGER CONTENT */}
          <div className="flex-1 flex flex-col bg-[#f8fafc]">
            <header className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Database size={18} className="text-slate-400" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-[#1a3a32] uppercase tracking-widest">Evidence Ledger</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Support Documentation Registry</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 gap-3">
                {indicator.evidence?.length > 0 ? (
                  indicator.evidence.map((ev: IEvidence, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewFile(ev)}
                      className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-[#c2a336] hover:shadow-md transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-slate-50 rounded flex items-center justify-center text-slate-400 group-hover:bg-[#c2a336]/10 group-hover:text-[#c2a336] transition-colors">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{ev.fileName}</p>
                        <p className="text-[9px] text-slate-400 font-mono uppercase mt-0.5">Asset Verified • {new Date(ev.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <Eye size={14} className="text-slate-300 group-hover:text-[#1a3a32]" />
                    </button>
                  ))
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <AlertCircle size={32} className="text-slate-200 mb-2" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Documents Available</span>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-8 bg-white border-t border-slate-200 flex items-center justify-end gap-4">
              <button
                disabled={processingId === indicator._id || indicator.status === "completed"}
                onClick={() => onReview(indicator, false)}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                Return for Revision
              </button>
              
              <button
                disabled={processingId === indicator._id || indicator.status === "completed"}
                onClick={() => onReview(indicator, true)}
                className="flex items-center gap-3 px-10 py-4 bg-[#1a3a32] text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#c2a336] hover:text-[#1a3a32] transition-all shadow-xl shadow-slate-200"
              >
                {processingId === indicator._id ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
                Seal Registry Entry
              </button>
            </footer>
          </div>
        </div>
      </div>

      {previewFile && (
        <EvidencePreviewModal
          file={previewFile}
          indicatorId={indicator._id}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
};

export default SuperAdminApproved;