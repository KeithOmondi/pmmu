// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  approveIndicator,
  rejectIndicator,
  type IIndicator,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";
import {
  fetchUsers,
  selectAllUsers,
  type IUser,
} from "../../store/slices/userSlice";
import {
  submitIndicatorScore,
  selectScore,
  resetScoreState,
} from "../../store/slices/scoreSlice";
import {
  Loader2,
  User as UserIcon,
  Users as GroupIcon,
  Calendar,
  ChevronLeft,
  XCircle,
  FileText,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Eye,
  Lock,
  Gavel,
  History,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ----------------------------
  // SELECTORS
  // ----------------------------
  const indicators = useAppSelector((state) => state.indicators.allIndicators);
  const users = useAppSelector(selectAllUsers);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { loading: scoreLoading } = useAppSelector(selectScore);

  // ----------------------------
  // LOCAL STATE
  // ----------------------------
  const [loading, setLoading] = useState<boolean>(true);
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [selectedProgress, setSelectedProgress] = useState<number>(0);

  const isSuperAdmin = currentUser?.role?.toLowerCase() === "superadmin";

  // ----------------------------
  // FETCH DATA
  // ----------------------------
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([dispatch(fetchAllIndicatorsForAdmin()), dispatch(fetchUsers())]);
      setLoading(false);
    };
    fetchData();
    return () => {
      dispatch(resetScoreState());
    };
  }, [dispatch]);

  // ----------------------------
  // GET CURRENT INDICATOR
  // ----------------------------
  const indicator: IIndicator | undefined = indicators.find((i) => i._id === id);

  useEffect(() => {
    if (indicator) setSelectedProgress(indicator.progress);
  }, [indicator]);

  // ----------------------------
  // PREVENT "SAVE IMAGE AS"
  // ----------------------------
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // ----------------------------
  // MEMOIZED EVIDENCE
  // ----------------------------
  const activeEvidence = useMemo(() => indicator?.evidence?.filter((e) => !e.isArchived) || [], [indicator]);
  const archivedEvidence = useMemo(() => indicator?.evidence?.filter((e) => e.isArchived) || [], [indicator]);

  // ----------------------------
  // HELPERS
  // ----------------------------
  const renderCustodians = (): string => {
    if (!indicator) return "-";
    if (indicator.assignedToType === "individual") {
      return users.find((u: IUser) => u._id === indicator.assignedTo)?.name || "Individual Custodian";
    }
    if (indicator.assignedToType === "group") {
      const groupNames = indicator.assignedGroup
        .map((userId) => users.find((u: IUser) => u._id === userId)?.name)
        .filter(Boolean);
      return groupNames.length > 0 ? groupNames.join(", ") : "Assigned Group";
    }
    return "Official";
  };

  const isFinalized: boolean = isSuperAdmin
    ? indicator?.status === "completed"
    : indicator?.status === "approved" || indicator?.status === "completed";

  // ----------------------------
  // ACTION HANDLERS
  // ----------------------------
  
  // PARTIAL UPDATE: Syncs score without changing status
  const handleSaveScore = async () => {
    if (!indicator) return;
    try {
      await dispatch(
        submitIndicatorScore({ 
          indicatorId: indicator._id, 
          score: selectedProgress,
          note: `Audit value adjusted to ${selectedProgress}% by ${currentUser?.role}`
        })
      ).unwrap();
      toast.success("Metric synced to registry.");
      dispatch(fetchAllIndicatorsForAdmin());
    } catch (err: any) {
      toast.error(err || "Failed to sync metric.");
    }
  };

  const handleApprove = async () => {
    if (!indicator || isFinalized) return;
    try {
      // Step 1: Ensure the latest selected score is saved
      await dispatch(
        submitIndicatorScore({ indicatorId: indicator._id, score: selectedProgress })
      ).unwrap();

      // Step 2: Proceed with approval/finalization
      await dispatch(
        approveIndicator({ id: indicator._id, notes: `Verified and Approved by ${currentUser?.role}` })
      ).unwrap();

      toast.success(isSuperAdmin ? "Indicator Finalized" : "Indicator Approved");
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Approval failed.");
    }
  };

  const handleReject = async () => {
    if (!indicator || isFinalized) return;
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) return toast.error("A justification is required.");

    try {
      await dispatch(rejectIndicator({ id: indicator._id, notes: trimmedReason })).unwrap();
      toast.success("Indicator returned for revision.");
      setShowRejectModal(false);
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Failed to reject indicator.");
    }
  };

  if (loading) return <LoadingState />;
  if (!indicator) return <div className="p-20 text-center font-bold text-[#1a3a32]">Record Not Found.</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8 max-w-7xl mx-auto select-none font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-[#8c94a4] hover:text-[#1a3a32] font-black text-[10px] uppercase tracking-[0.2em] transition-all">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Registry
        </button>
        <div className="flex gap-3">
          {indicator.rejectionCount > 0 && (
            <div className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200 shadow-sm flex items-center gap-2">
              <History size={14} />
              Attempt #{indicator.rejectionCount + 1}
            </div>
          )}
          <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${getStatusStyles(indicator.status)}`}>
            <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {indicator.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: INFORMATION & EVIDENCE */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* MAIN INFO CARD */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-[#c2a336] mb-4 font-black uppercase tracking-[0.2em] text-[10px]">
              <ShieldCheck size={14} /> Submission Audit #ID-{indicator._id.slice(-6).toUpperCase()}
            </div>
            <h1 className="text-3xl font-black text-[#1a3a32] tracking-tighter leading-[1.1] mb-6 font-serif">
              {indicator.indicatorTitle}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-50">
              <Stat icon={indicator.assignedToType === "group" ? <GroupIcon size={14} /> : <UserIcon size={14} />} label="Custodian" value={renderCustodians()} />
              <Stat icon={<Calendar size={14} />} label="Due Date" value={new Date(indicator.dueDate).toLocaleDateString()} />
              <Stat icon={<FileText size={14} />} label="Unit" value={indicator.unitOfMeasure} />
              <Stat icon={<TrendingUp size={14} />} label="Progress" value={`${indicator.progress}%`} />
            </div>
          </div>

          {/* ACTIVE EVIDENCE LIST */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="text-[#c2a336]" size={18} /> Verification Exhibits
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-500 uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <Lock size={10} /> Secure Preview
              </div>
            </div>

            {activeEvidence.length === 0 ? <EmptyEvidence /> : (
              <ul className="divide-y divide-slate-50">
                {activeEvidence.map((file: IEvidence) => (
                  <li key={file.publicId} className="py-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors rounded-xl px-4">
                    <div className="flex flex-col max-w-[70%]">
                      <span className="text-sm font-bold text-[#1a3a32] truncate">{file.fileName}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-black mt-1">
                        {file.description || "System Verified Entry"}
                      </span>
                    </div>
                    <button onClick={() => setPreviewFile(file)} className="flex items-center gap-2 px-4 py-2 bg-[#1a3a32] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#c2a336] transition-all shadow-md">
                      <Eye size={14} /> Preview
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ARCHIVED/REJECTION HISTORY */}
          {archivedEvidence.length > 0 && (
            <div className="bg-slate-100/50 rounded-[2.5rem] p-8 border border-dashed border-slate-200">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                <History size={14} /> Historical Evidence Logs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivedEvidence.map((file: IEvidence) => (
                  <div key={file.publicId} className="bg-white/60 p-4 rounded-xl flex items-center justify-between border border-slate-100 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 truncate">{file.fileName}</span>
                      <span className="text-[8px] text-slate-400 font-black uppercase">Archived Entry</span>
                    </div>
                    <button onClick={() => setPreviewFile(file)} className="p-2 text-slate-400 hover:text-[#1a3a32] transition-colors">
                      <Eye size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AUDIT CONTROLS */}
        <div className="bg-[#1a3a32] rounded-[3rem] p-8 text-white shadow-2xl space-y-8 sticky top-10 border border-white/5">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c2a336]">
              {isSuperAdmin ? "Final Certification" : "Audit Review Controls"}
            </h3>
            <p className="text-xs leading-relaxed text-slate-300 font-medium italic">
              Verify evidence before adjusting the metric or changing the status.
            </p>
          </div>

          {/* METRIC ADJUSTMENT PANEL */}
          <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#c2a336] block">Adjusted Audit Value</label>
            <div className="relative">
              <select
                disabled={isFinalized}
                value={selectedProgress}
                onChange={(e) => setSelectedProgress(Number(e.target.value))}
                className="w-full bg-[#1a3a32] border-2 border-white/10 rounded-2xl p-4 text-sm font-black appearance-none focus:border-[#c2a336] outline-none transition-all"
              >
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                  <option key={val} value={val} className="bg-[#1a3a32] text-white">{val}% Performance</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#c2a336]">
                <TrendingUp size={16} />
              </div>
            </div>

            {/* PARTIAL SAVE BUTTON */}
            <button
              onClick={handleSaveScore}
              disabled={isFinalized || scoreLoading || selectedProgress === indicator?.progress}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#c2a336] border border-[#c2a336]/20 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {scoreLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Update Progress Value Only
            </button>
          </div>

          {/* TERMINAL ACTIONS */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <button
              onClick={handleApprove}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                isFinalized ? "bg-gray-600 text-slate-400 cursor-not-allowed" : "bg-[#c2a336] hover:bg-[#d4b44a] text-[#1a3a32]"
              }`}
            >
              <Gavel size={18} /> {isSuperAdmin ? "Certify & Close" : "Approve Submission"}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${
                isFinalized ? "bg-transparent border-gray-600 text-gray-600 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white border-white/10"
              }`}
            >
              <XCircle size={18} /> Send for Revision
            </button>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAYS */}
      {showRejectModal && (
        <RejectModal
          reason={rejectReason}
          setReason={setRejectReason}
          onConfirm={handleReject}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      {previewFile && indicator && (
        <EvidencePreviewModal
          file={previewFile}
          indicatorId={indicator._id}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

/* --- SHARED STYLES & SUBCOMPONENTS --- */

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved": return "bg-amber-50 text-amber-700 border-amber-200";
    case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "submitted": return "bg-blue-50 text-blue-700 border-blue-200";
    case "rejected": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const LoadingState: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
    <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
    <p className="text-[#8c94a4] font-black uppercase tracking-[0.3em] text-[10px]">Secure Registry Loading...</p>
  </div>
);

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
      {icon} {label}
    </div>
    <div className="text-xs font-black text-[#1a3a32] uppercase tracking-tight line-clamp-2">{value}</div>
  </div>
);

const EmptyEvidence: React.FC = () => (
  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
    <AlertTriangle size={32} className="mx-auto text-amber-300 mb-4" />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No verified exhibits found</p>
  </div>
);

const RejectModal: React.FC<{ reason: string; setReason: (r: string) => void; onConfirm: () => void; onClose: () => void }> = ({ reason, setReason, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-[#1a3a32]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
      <div className="flex items-center gap-3 text-rose-600 mb-6">
        <AlertTriangle size={28} />
        <h2 className="text-2xl font-black uppercase tracking-tight italic">Revision Instructions</h2>
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Detail the missing verification or corrections needed..."
        className="w-full border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-8 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition-all min-h-[150px]"
      />
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 py-4 font-black uppercase tracking-widest text-slate-400 text-[10px]">Back</button>
        <button onClick={onConfirm} className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-200">Return Entry</button>
      </div>
    </div>
  </div>
);

export default SubmittedIndicatorDetail;