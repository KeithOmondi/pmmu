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
  updateIndicator,
  downloadEvidence,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Gavel,
  X,
  FileText,
  Download,
  Calendar,
  FileCheck,
  Clock,
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
  const indicators = useAppSelector(selectAllIndicators);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
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

  const getAssignedName = (indicator: any) => {
    if (indicator.assignedToType === "department") return "Department Group";
    const assignedData = indicator.assignedTo;
    if (!assignedData) return "Unassigned";
    if (typeof assignedData === "object" && assignedData !== null)
      return assignedData.name || "Unknown User";
    const foundUser = allUsers.find((u) => u._id === assignedData);
    return foundUser ? foundUser.name : "Unknown";
  };

  const handleDownload = async (
    indicatorId: string,
    publicId: string,
    fileName: string
  ) => {
    try {
      setDownloadingId(publicId);
      await dispatch(
        downloadEvidence({ indicatorId, publicId, fileName })
      ).unwrap();
      toast.success("Secure download initiated");
    } catch (err: any) {
      toast.error(err || "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReview = async (indicator: IIndicator, approve: boolean) => {
    try {
      setProcessingId(indicator._id);
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: { status: approve ? "completed" : "approved" },
        })
      ).unwrap();
      toast.success(
        approve ? "Protocol Ratified & Locked" : "Returned to Review"
      );
      setSelectedIndicator(null);
    } catch {
      toast.error("Registry Update Failed");
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
            <h1 className="text-4xl lg:text-3xl font-black text-[#1a3a32] tracking-[ -0.04em] leading-none">
              Approvals <span className="text-[#c2a336]"></span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Review and authorize submitted compliance records.
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
              <ShieldCheck
                className="text-[#c2a336] drop-shadow-sm"
                size={32}
              />
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
                  {isCompleted(i) ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <FileText size={24} />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1a3a32] text-lg leading-tight transition-colors group-hover:text-[#c2a336]">
                    {i.indicatorTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black text-[#c2a336] uppercase tracking-tighter bg-[#c2a336]/10 px-2 py-0.5 rounded">
                      {i.category?.title}
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
                  <span className="text-[9px] font-black text-gray-400 uppercase">
                    Phase
                  </span>
                  <span
                    className={`text-[11px] font-black uppercase ${
                      i.status === "completed"
                        ? "text-emerald-600"
                        : "text-blue-600"
                    }`}
                  >
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
                  className="px-8 py-3.5 bg-[#1a3a32] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#c2a336] hover:shadow-lg hover:shadow-[#c2a336]/20 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                >
                  Ratify <ChevronRight size={14} />
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
          onDownload={handleDownload}
          processingId={processingId}
          downloadingId={downloadingId}
          assignedName={getAssignedName(selectedIndicator)}
        />
      )}
    </div>
  );
};

/* --- MODAL SUB-COMPONENT --- */
const AuditModal = ({
  indicator,
  onClose,
  onReview,
  onDownload,
  processingId,
  assignedName,
}: any) => {
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
      <div
        className="absolute inset-0 bg-[#0a1a16]/80 backdrop-blur-md transition-opacity duration-500"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in zoom-in duration-300">
        {/* MODAL HEADER */}
        <div className="bg-[#1a3a32] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c2a336] opacity-[0.05] -mr-32 -mt-32 rounded-full"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase tracking-[0.2em] text-[10px]">
                <ShieldCheck size={16} /> Secure Verification Desk
              </div>
              <h3 className="text-3xl font-black leading-tight tracking-tight max-w-[90%]">
                {indicator.indicatorTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm group">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Compliance Health
              </p>
              {compliance.status === "none" ? (
                <p className="text-xs font-bold text-gray-400 italic">
                  No Registry Data
                </p>
              ) : (
                <div
                  className={`flex items-center gap-3 text-sm font-black ${
                    compliance.early ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      compliance.early ? "bg-emerald-50" : "bg-rose-50"
                    }`}
                  >
                    <FileCheck size={18} />
                  </div>
                  <span>
                    {compliance.label}{" "}
                    {compliance.early ? "Ahead of Schedule" : "Past Due"}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 bg-[#1a3a32] rounded-[2rem] border border-white/10 shadow-xl group">
              <p className="text-[10px] font-black text-[#c2a336] uppercase tracking-widest mb-3">
                Admin Ratification
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Calendar size={18} className="text-[#c2a336]" />
                  </div>
                  <span className="text-sm font-black">
                    {new Date(indicator.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#c2a336] uppercase tracking-tighter pl-11">
                  <Clock size={12} />
                  {new Date(indicator.updatedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* META INFO */}
          <div className="grid grid-cols-2 gap-8 px-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Protocol Architecture
              </p>
              <p className="text-sm font-extrabold text-[#1a3a32]">
                {indicator.category?.title}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Ownership
              </p>
              <p className="text-sm font-extrabold text-[#1a3a32] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c2a336]"></span>{" "}
                {assignedName}
              </p>
            </div>
          </div>

          {/* EVIDENCE LIST */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Evidence Registry
            </p>
            {indicator.evidence?.length > 0 ? (
              <div className="space-y-3">
                {indicator.evidence.map((ev: any, idx: number) => (
                  <div
                    key={idx}
                    className="group/item p-4 bg-white border border-gray-100 rounded-[1.5rem] flex justify-between items-center transition-all hover:border-[#c2a336]/40 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#1a3a32] group-hover/item:text-white transition-all">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#1a3a32] truncate max-w-[180px]">
                          {ev.fileName}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          Timestamp: {new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onDownload(indicator._id, ev.publicId, ev.fileName)
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-[#c2a336] text-[10px] font-black uppercase rounded-xl hover:bg-[#c2a336] hover:text-white transition-all"
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-bold uppercase italic">
                  No Secure Files Linked
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-10 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4">
          <button
            disabled={!!processingId || indicator.status === "completed"}
            onClick={() => onReview(indicator, false)}
            className="flex-1 py-5 bg-white text-rose-600 border-2 border-rose-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all disabled:opacity-30"
          >
            Revoke Submission
          </button>
          <button
            disabled={!!processingId || indicator.status === "completed"}
            onClick={() => onReview(indicator, true)}
            className="flex-[1.5] py-5 bg-[#1a3a32] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#1a3a32]/30 hover:bg-[#c2a336] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none"
          >
            {processingId === indicator._id ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {indicator.status === "completed"
              ? "RECORD AUTHORIZED"
              : "APPROVE SUBMISSION"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminApproved;
