// src/pages/SuperAdminApproved.tsx
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
  updateIndicator,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Gavel,
  Users,
  X,
  FileText,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminApproved: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(null);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Filter indicators that are approved or completed
  const reviewIndicators = useMemo(
    () =>
      indicators.filter((i) => i.status === "approved" || i.status === "completed"),
    [indicators]
  );

  const isCompleted = (indicator: IIndicator) => indicator.status === "completed";

  const getAssignedName = (indicator: any) => {
    if (indicator.assignedToType === "department") return "Department Group";

    const assignedData = indicator.assignedTo;
    if (!assignedData) return "Unassigned";

    if (typeof assignedData === "object" && assignedData !== null) {
      return assignedData.name || "Unknown User";
    }

    const foundUser = allUsers.find((u) => u._id === assignedData);
    if (foundUser) return foundUser.name;

    return typeof assignedData === "string"
      ? `ID: ${assignedData.substring(0, 5)}...`
      : "Unknown";
  };

  const handleReview = async (indicator: IIndicator, approve: boolean) => {
    try {
      setProcessingId(indicator._id);

      if (!isCompleted(indicator)) {
        await dispatch(
          updateIndicator({
            id: indicator._id,
            updates: { status: approve ? "completed" : "approved" },
          })
        ).unwrap();

        toast.success(
          approve
            ? "Protocol Ratified & Locked"
            : "Returned to Department Review"
        );

        // Keep it visible, just update local state
        setSelectedIndicator((prev) =>
          prev?._id === indicator._id ? { ...indicator, status: approve ? "completed" : "approved" } : prev
        );
      }
    } catch {
      toast.error("Registry Update Failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !indicators.length) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-[#1a3a32]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#c2a336]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Syncing Master Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa] relative">
      {/* Header */}
      <div className="mb-6 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#c2a336] mb-2 font-black uppercase tracking-[0.2em] text-[10px]">
            <Gavel size={14} /> SuperAdmin Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a32] tracking-tighter leading-tight">
            Pending Ratification
          </h1>
        </div>

        <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Queue Length
            </p>
            <p className="text-xl font-black text-[#1a3a32]">
              {reviewIndicators.length}
            </p>
          </div>
          <ShieldCheck className="text-[#c2a336]" size={28} />
        </div>
      </div>

      {/* Main List */}
      {!reviewIndicators.length ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-20 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-emerald-100 mb-4" size={48} />
          <p className="text-[#1a3a32] font-black italic">
            The registry is currently clear.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviewIndicators.map((i) => (
            <div
              key={i._id}
              className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group transition-all hover:border-[#c2a336]/30 ${
                isCompleted(i) ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-[#1a3a32] shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-black text-[#1a3a32] leading-tight group-hover:text-[#c2a336] transition-colors">
                    {i.indicatorTitle}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {i.category?.title} • {getAssignedName(i)}
                  </p>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                    i.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {i.status === "completed" ? "Completed" : "Approved"}
                </span>

                <button
                  onClick={() => setSelectedIndicator(i)}
                  className="p-3 text-gray-400 hover:text-[#1a3a32] hover:bg-gray-100 rounded-xl transition-all"
                >
                  <Eye size={20} />
                </button>

                <button
                  disabled={!!processingId || isCompleted(i)}
                  onClick={() => handleReview(i, true)}
                  className="px-6 py-2.5 bg-[#1a3a32] text-white text-[11px] font-black uppercase rounded-xl hover:bg-[#c2a336] transition-all disabled:opacity-50"
                >
                  Ratify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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

/* --- MODAL SUB-COMPONENT --- */
const AuditModal = ({
  indicator,
  onClose,
  onReview,
  processingId,
  assignedName,
}: any) => (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-[#1a3a32]/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    />
    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="bg-[#1a3a32] p-8 text-white flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-[#c2a336] mb-1 font-black uppercase tracking-widest text-[10px]">
            <ShieldCheck size={14} /> Audit Dossier
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

      {/* Body */}
      <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Architecture
            </p>
            <p className="text-sm font-bold text-[#1a3a32]">
              {indicator.category?.title}
            </p>
            <p className="text-[11px] text-gray-500 italic">
              {indicator.level2Category?.title}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Assigned To
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-[#1a3a32]">
              <Users size={14} className="text-[#c2a336]" />
              {assignedName}
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-[#c2a336]" size={20} />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">
                Submission Timeline
              </p>
              <p className="text-xs font-bold text-gray-700">
                Due: {new Date(indicator.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Progress
            </p>
            <p className="text-xl font-black text-emerald-600">
              {indicator.progress}%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Evidence Registry
          </p>
          {indicator.evidence?.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {indicator.evidence.map((ev: any, idx: number) => (
                <div
                  key={ev._id || idx}
                  className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center group/item hover:border-[#c2a336]/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-600 truncate max-w-[200px]">
                      {ev.originalName || ev.filename || `Evidence_${idx + 1}`}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      Uploaded:{" "}
                      {new Date(indicator.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#c2a336] text-[10px] font-black uppercase hover:underline flex items-center gap-1"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              No files attached to this dossier.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
        <button
          disabled={!!processingId}
          onClick={() => onReview(indicator, false)}
          className="py-4 bg-white text-rose-600 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
        >
          Reject Submission
        </button>
        <button
          disabled={!!processingId}
          onClick={() => onReview(indicator, true)}
          className="py-4 bg-[#1a3a32] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#1a3a32]/20 hover:bg-[#c2a336] transition-all flex items-center justify-center gap-2"
        >
          {processingId === indicator._id ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Ratify Protocol
        </button>
      </div>
    </div>
  </div>
);

export default SuperAdminApproved;
