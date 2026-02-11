import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  updateIndicator,
  type IIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import { submitIndicatorScore } from "../../store/slices/scoreSlice"; // Import scoring logic
import {
  Loader2,
  Eye,
  ShieldCheck,
  Gavel,
  X,
  FileText,
  Database,
  Lock,
  Search,
  Target,
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

  // Updated to accept the manually selected score from the modal
  const handleReview = async (indicator: IIndicator, approve: boolean, manualScore?: number) => {
    try {
      setProcessingId(indicator._id);

      if (approve) {
        // 1. Submit the Official Score selected by the Super Admin
        await dispatch(
          submitIndicatorScore({ 
            indicatorId: indicator._id, 
            score: manualScore ?? indicator.progress 
          })
        ).unwrap();
      }

      // 2. Finalize status and log ratification time
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: {
            status: approve ? "completed" : "approved",
            reviewedAt: new Date().toISOString(),
          },
        })
      ).unwrap();

      toast.success(approve ? "Protocol Ratified & Score Locked" : "Returned for Further Review");
      setSelectedIndicator(null);
    } catch (err: any) {
      toast.error(err || "Registry Update Failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex flex-col font-sans">
      <header className="bg-[#1a3a32] text-white pt-12 pb-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#c2a336]">
              <Gavel size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Authorization Terminal</span>
            </div>
            <h1 className="text-4xl font-serif font-black tracking-tight">Registry Approval Queue</h1>
            <p className="text-white/60 text-sm max-w-md">Final executive review, scoring, and sealing of protocols into the master ledger.</p>
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
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress Claim: {i.progress}%</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-[#c2a336]">{getAssignedName(i)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedIndicator(i)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#1a3a32] text-[#c2a336] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#c2a336] hover:text-[#1a3a32] transition-all"
                  >
                    <Eye size={14} /> {i.status === "completed" ? "View Archive" : "Review & Seal"}
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

/* --- AUDIT MODAL COMPONENT --- */
const AuditModal = ({
  indicator,
  onClose,
  onReview,
  processingId,
  assignedName,
}: {
  indicator: IIndicator;
  onClose: () => void;
  onReview: (indicator: IIndicator, approve: boolean, manualScore?: number) => void;
  processingId: string | null;
  assignedName: string;
}) => {
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  
  // Local state for the Super Admin to select the final score
  const [finalScore, setFinalScore] = useState<number>(indicator.progress);

  const compliance = useMemo(() => {
    if (!indicator.evidence?.length || !indicator.dueDate) {
      return { status: "none", label: "Registry Data Missing" };
    }
    const dueTime = new Date(indicator.dueDate).getTime();
    const submissionTimes = indicator.evidence
      .map((e: any) => {
        const timestamp = e.createdAt || e.uploadedAt;
        return timestamp ? new Date(timestamp).getTime() : NaN;
      })
      .filter((t: number) => !isNaN(t))
      .sort((a: number, b: number) => a - b);

    if (submissionTimes.length === 0) return { status: "none", label: "No Timestamp Found" };

    const diff = dueTime - submissionTimes[0];
    const isEarly = diff >= 0;
    return { status: "calculated", early: isEarly, label: formatDuration(diff) };
  }, [indicator]);

  return (
    <>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-[#020817]/95 backdrop-blur-md" onClick={onClose} />

        <div className="relative bg-white w-full max-w-6xl h-full sm:h-[90vh] rounded-none sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row text-[#1a3a32]">
          
          <aside className="w-full md:w-[360px] bg-[#0f172a] text-slate-300 p-8 flex flex-col border-r border-white/5 shrink-0">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-[#c2a336] mb-4">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Executive Dossier</span>
              </div>
              <h3 className="text-2xl font-bold text-white leading-tight mb-2">{indicator.indicatorTitle}</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">REF: {indicator._id.slice(-12).toUpperCase()}</p>
            </div>

            <div className="space-y-8 flex-1">
              {/* Custodian Info */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Submitted By:</label>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-[#c2a336] flex items-center justify-center text-[#1a3a32] font-bold text-xs">
                        {assignedName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-white">{assignedName}</span>
                </div>
              </div>

              {/* RATIFICATION SCORING SECTION (The Point of Control) */}
              <div className="bg-[#c2a336]/10 p-6 rounded-2xl border border-[#c2a336]/20 space-y-4">
                <div className="flex justify-between items-end">
                   <label className="text-[10px] font-black text-[#c2a336] uppercase tracking-widest">Performance Rating</label>
                   <span className="text-3xl font-mono font-bold text-white">{finalScore}%</span>
                </div>
                
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={finalScore}
                  onChange={(e) => setFinalScore(parseInt(e.target.value))}
                  disabled={indicator.status === "completed"}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#c2a336]"
                />
                
                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                   <span>Custodian Claim: {indicator.progress}%</span>
                   <span className="text-emerald-400">Target: 100%</span>
                </div>
                
                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                  As Super Admin, adjust the slider to assign the official performance score based on the evidence registry.
                </p>
              </div>

              {/* Analysis */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                  <span className="block text-[8px] text-slate-500 uppercase tracking-widest mb-1">Time Compliance</span>
                  {compliance.status === "none" ? (
                       <span className="text-xs font-mono text-slate-400 italic">{compliance.label}</span>
                  ) : (
                      <div className="flex flex-col">
                          <span className={`text-sm font-mono font-bold ${compliance.early ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {compliance.early ? 'IN-TIME' : 'LATE'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 font-mono italic">
                              {compliance.label} {compliance.early ? 'before deadline' : 'past deadline'}
                          </span>
                      </div>
                  )}
              </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col bg-[#f8fafc]">
            <header className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                    <Database size={18} className="text-slate-400" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-[#1a3a32] uppercase tracking-widest">Evidence Registry</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Reviewing {indicator.evidence?.length || 0} Assets</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {indicator.evidence?.map((ev, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewFile(ev)}
                    className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#c2a336] transition-all text-left shadow-sm"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#c2a336]/10 group-hover:text-[#c2a336] transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{ev.fileName}</p>
                      <p className="text-[9px] text-slate-400 font-mono uppercase mt-0.5">Click to Inspect</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <footer className="p-8 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="hidden lg:flex items-center gap-3 text-slate-400">
                <Target size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Final Ratification at {finalScore}%</span>
              </div>
              
              <div className="flex gap-4">
                <button
                  disabled={!!processingId || indicator.status === "completed"}
                  onClick={() => onReview(indicator, false)}
                  className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  Return for Revision
                </button>
                <button
                  disabled={!!processingId || indicator.status === "completed"}
                  onClick={() => onReview(indicator, true, finalScore)}
                  className="flex items-center gap-3 px-12 py-4 bg-[#1a3a32] text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#c2a336] hover:text-[#1a3a32] transition-all shadow-xl shadow-[#1a3a32]/10"
                >
                  {processingId === indicator._id ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
                  Seal Entry at {finalScore}%
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center">
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

export default SuperAdminApproved;