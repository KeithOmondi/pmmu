// src/pages/Admin/SuperAdminApproved.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUsers,
  selectAllUsers,
  type IUser,
} from "../../store/slices/userSlice";
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
  Calendar,
  FileCheck,
  ChevronRight,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";

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

const SuperAdminApproved: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Selection aligned with IndicatorState.allIndicators
  const indicators = useAppSelector((state) => state.indicators.allIndicators);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const reviewIndicators = useMemo(
    () =>
      indicators.filter(
        (i) => i.status === "approved" || i.status === "completed"
      ),
    [indicators]
  );

  const isCompleted = (indicator: IIndicator) =>
    indicator.status === "completed";

  const getAssignedName = (indicator: IIndicator) => {
    // Aligned with slice AssignedToType: "individual" | "group"
    if (indicator.assignedToType === "group") return "Department Group";

    const assignedData = indicator.assignedTo;
    if (!assignedData) return "Unassigned";

    // Handle populated object or string ID
    if (typeof assignedData === "object" && assignedData !== null)
      return (assignedData as any).name || "Unknown User";

    const foundUser = allUsers.find((u) => u._id === assignedData);
    return foundUser ? foundUser.name : "System User";
  };

  const handleReview = async (indicator: IIndicator, approve: boolean) => {
    try {
      setProcessingId(indicator._id);
      
      // Using updateIndicator thunk to flip status
      // Ratify -> completed | Return -> approved (stays in this list but needs re-verification)
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: { 
            status: approve ? "completed" : "approved",
            reviewedAt: new Date().toISOString() 
          },
        })
      ).unwrap();

      toast.success(
        approve ? "Protocol Ratified & Locked" : "Returned for Further Review"
      );
      setSelectedIndicator(null);
    } catch (err: any) {
      toast.error(err || "Registry Update Failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-12 bg-[#F4F7F6] relative font-sans selection:bg-[#c2a336]/30">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#c2a336] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
              <span className="w-8 h-[2px] bg-[#c2a336]"></span>
              <Gavel size={14} /> Super Admin Approval
            </div>
            <h1 className="text-4xl lg:text-3xl font-black text-[#1a3a32] tracking-tight leading-none">
              Approvals
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Authorize and finalize submitted compliance records.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#c2a336] to-[#1a3a32] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white px-8 py-5 rounded-2xl flex items-center gap-6 border border-white/20 shadow-xl">
              <div className="text-right border-r border-gray-100 pr-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Queue Status
                </p>
                <p className="text-3xl font-black text-[#1a3a32] tabular-nums leading-none">
                  {reviewIndicators.length.toString().padStart(2, "0")}
                </p>
              </div>
              <ShieldCheck className="text-[#c2a336] drop-shadow-sm" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4">
        {reviewIndicators.length > 0 ? (
          reviewIndicators.map((i) => (
            <div
              key={i._id}
              className={`group bg-white rounded-3xl p-6 border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:shadow-2xl hover:border-[#c2a336]/40 hover:-translate-y-1 ${
                isCompleted(i) ? "bg-gray-50/50 grayscale-[0.5]" : ""
              }`}
            >
              <div className="flex items-center gap-6 flex-1">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                    isCompleted(i)
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-[#1a3a32] group-hover:bg-[#1a3a32] group-hover:text-white"
                  }`}
                >
                  {isCompleted(i) ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1a3a32] text-lg leading-tight transition-colors group-hover:text-[#c2a336]">
                    {i.indicatorTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black text-[#c2a336] uppercase tracking-tighter bg-[#c2a336]/10 px-2 py-0.5 rounded">
                      {i.category?.title || "Registry Item"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight italic">
                      {getAssignedName(i)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end px-4 border-l border-gray-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Phase</span>
                  <span className={`text-[11px] font-black uppercase ${i.status === "completed" ? "text-emerald-600" : "text-blue-600"}`}>
                    {i.status}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedIndicator(i)}
                  className="p-4 text-gray-400 hover:text-[#1a3a32] hover:bg-gray-100 rounded-2xl transition-all"
                >
                  <Eye size={22} />
                </button>

                <button
                  disabled={!!processingId || isCompleted(i)}
                  onClick={() => handleReview(i, true)}
                  className="px-8 py-3.5 bg-[#1a3a32] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#c2a336] transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  {processingId === i._id ? <Loader2 className="animate-spin" size={14} /> : "Ratify"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
            <Database size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              No Pending Authorizations
            </p>
          </div>
        )}
      </div>

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

/* --- AUDIT MODAL --- */
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
  const compliance = useMemo(() => {
    if (!indicator.evidence?.length) return { status: "none" };
    const dueTime = new Date(indicator.dueDate).getTime();
    const submissionTimes = indicator.evidence
      .map((e: any) => (e.createdAt ? new Date(e.createdAt).getTime() : NaN))
      .filter((t: number) => !isNaN(t))
      .sort((a: number, b: number) => a - b);

    if (!submissionTimes.length) return { status: "none" };
    const diff = dueTime - submissionTimes[0];
    return {
      status: "calculated",
      early: diff > 0,
      label: formatDuration(diff),
    };
  }, [indicator]);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#0a1a16]/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl transition-all animate-in fade-in zoom-in duration-300">
        <div className="bg-[#1a3a32] p-10 text-white relative">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase tracking-widest text-[10px]">
                <ShieldCheck size={16} /> Secure Verification Desk
              </div>
              <h3 className="text-3xl font-black leading-tight">{indicator.indicatorTitle}</h3>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto bg-slate-50/30">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Compliance Health</p>
              {compliance.status === "none" ? (
                <p className="text-xs font-bold text-gray-400 italic">No Registry Data</p>
              ) : (
                <div className={`flex items-center gap-3 text-sm font-black ${compliance.early ? "text-emerald-600" : "text-rose-600"}`}>
                  <FileCheck size={18} />
                  <span>{compliance.label} {compliance.early ? "Ahead" : "Past Due"}</span>
                </div>
              )}
            </div>

            <div className="p-5 bg-[#1a3a32] rounded-[2rem] text-white">
              <p className="text-[10px] font-black text-[#c2a336] uppercase tracking-widest mb-3">Last Registry Update</p>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-[#c2a336]" />
                <span className="text-sm font-black">
                  {new Date(indicator.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* ADDED META INFO: Here is where assignedName is now used */}
          <div className="grid grid-cols-2 gap-8 px-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Architecture</p>
              <p className="text-sm font-extrabold text-[#1a3a32]">{indicator.category?.title || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ownership</p>
              <p className="text-sm font-extrabold text-[#1a3a32] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c2a336]"></span> {assignedName}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Evidence Registry</p>
            {indicator.evidence?.length > 0 ? (
              <div className="space-y-3">
                {indicator.evidence.map((ev: IEvidence, idx: number) => (
                  <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 transition-all hover:border-[#c2a336]/40">
                    <FileText className="text-gray-400" size={18} />
                    <p className="text-sm font-extrabold text-[#1a3a32] truncate">{ev.fileName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold italic text-gray-400">No Evidence Found</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              disabled={processingId === indicator._id || indicator.status === "completed"}
              onClick={() => onReview(indicator, true)}
              className="px-8 py-3.5 bg-[#1a3a32] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#c2a336] disabled:opacity-30 transition-all shadow-md hover:shadow-lg"
            >
              Ratify Protocol
            </button>
            <button
              disabled={processingId === indicator._id || indicator.status === "completed"}
              onClick={() => onReview(indicator, false)}
              className="px-8 py-3.5 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 disabled:opacity-30 transition-all"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminApproved;