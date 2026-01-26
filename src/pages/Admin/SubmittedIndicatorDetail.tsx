// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  updateIndicator,
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
  Loader2,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Eye,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators: IIndicator[] = useAppSelector(
    (state) => state.indicators.allIndicators,
  );
  const users = useAppSelector(selectAllUsers);

  const [loading, setLoading] = useState<boolean>(true);
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [selectedProgress, setSelectedProgress] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        dispatch(fetchAllIndicatorsForAdmin()),
        dispatch(fetchUsers()),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [dispatch]);

  const indicator: IIndicator | undefined = indicators.find(
    (i: IIndicator) => i._id === id,
  );

  useEffect(() => {
    if (indicator) setSelectedProgress(indicator.progress);
  }, [indicator]);

  // Deter unauthorized "Save Image As"
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const getUserName = (userId: string | null): string =>
    userId
      ? users.find((u: IUser) => u._id === userId)?.name || "Official"
      : "-";

  const isFinalized: boolean =
    indicator?.status === "approved" || indicator?.status === "completed";

  const handleApprove = async () => {
    if (!indicator || isFinalized) return;
    const res = await dispatch(
      updateIndicator({
        id: indicator._id,
        updates: {
          status: selectedProgress === 100 ? "completed" : "approved",
          progress: selectedProgress,
        },
      }),
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success(`Verified: Metric set to ${selectedProgress}%`);
      navigate("/admin/dashboard");
    }
  };

  const handleReject = async () => {
    if (!indicator || isFinalized) return;
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) return toast.error("A justification is required.");
    try {
      await dispatch(
        rejectIndicator({ id: indicator._id, notes: trimmedReason }),
      ).unwrap();
      toast.success("Indicator rejected successfully.");
      setShowRejectModal(false);
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Failed to reject indicator.");
    }
  };

  if (loading) return <LoadingState />;
  if (!indicator)
    return (
      <div className="p-20 text-center font-bold font-serif text-[#1a3a32]">
        Record Not Found.
      </div>
    );

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8 max-w-7xl mx-auto select-none">
      {/* Header Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[#8c94a4] hover:text-[#1a3a32] font-black text-[10px] uppercase tracking-[0.2em] transition-all"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Registry
        </button>
        <div
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(indicator.status)}`}
        >
          Status: {indicator.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#c2a336] mb-4 font-black uppercase tracking-[0.2em] text-[10px]">
              <ShieldCheck size={14} /> Submission Audit #ID-
              {indicator._id.slice(-6).toUpperCase()}
            </div>
            <h1 className="text-3xl font-black text-[#1a3a32] tracking-tighter leading-[1.1] mb-6 font-serif">
              {indicator.indicatorTitle}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-50">
              <Stat
                icon={<UserIcon size={14} />}
                label="Custodian"
                value={getUserName(indicator.assignedTo)}
              />
              <Stat
                icon={<Calendar size={14} />}
                label="Due Date"
                value={new Date(indicator.dueDate).toLocaleDateString()}
              />
              <Stat
                icon={<FileText size={14} />}
                label="Target Unit"
                value={indicator.unitOfMeasure}
              />
              <Stat
                icon={<TrendingUp size={14} />}
                label="Current Audit"
                value={`${indicator.progress}%`}
              />
            </div>
          </div>

          {/* Evidence Section - DESCRIPTION UPDATE HERE */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText className="text-[#c2a336]" size={18} /> Filed Exhibits
              </h3>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-500 uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                <Lock size={10} /> View Only Mode
              </div>
            </div>

            {!indicator.evidence?.length ? (
              <EmptyEvidence />
            ) : (
              <ul className="divide-y divide-slate-50">
                {indicator.evidence.map((file: IEvidence) => (
                  <li
                    key={file.publicId}
                    className="py-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors rounded-xl px-4"
                  >
                    <div className="flex flex-col max-w-[70%]">
                      <span className="text-sm font-bold text-[#1a3a32] truncate">
                        {file.fileName}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-black mt-1 leading-relaxed">
                        {file.description ? (
                          <span className="text-emerald-600 italic">
                            "{file.description}"
                          </span>
                        ) : (
                          `${file.mimeType} • System Verified`
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1a3a32] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#c2a336] transition-all shadow-md active:scale-95"
                    >
                      <Eye size={14} /> Preview
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-[9px] text-slate-400 italic text-center border-t border-slate-50 pt-4">
              Judiciary Security Policy: Direct downloads are disabled for
              Administrative Audits.
            </p>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="bg-[#1a3a32] rounded-[3rem] p-8 text-white shadow-2xl shadow-[#1a3a32]/20 space-y-8 sticky top-10 border border-white/5">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-[#c2a336]">
              Audit Judgment
            </h3>
            <p className="text-xs leading-relaxed text-slate-300 font-medium">
              Assess the evidence provided. Downloads are restricted to preserve
              document integrity during the review process.
            </p>
          </div>

          <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#c2a336] block">
              Set Completion Level
            </label>
            <div className="relative">
              <select
                disabled={isFinalized}
                value={selectedProgress}
                onChange={(e) => setSelectedProgress(Number(e.target.value))}
                className="w-full bg-[#1a3a32] border-2 border-white/10 rounded-2xl p-4 text-sm font-black appearance-none focus:border-[#c2a336] outline-none transition-all cursor-pointer"
              >
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                  (val: number) => (
                    <option
                      key={val}
                      value={val}
                      className="bg-[#1a3a32] text-white"
                    >
                      {val}% Completed
                    </option>
                  ),
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#c2a336]">
                <TrendingUp size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isFinalized ? "bg-gray-600 text-slate-400 cursor-not-allowed" : "bg-[#c2a336] hover:bg-[#d4b44a] text-[#1a3a32]"}`}
            >
              <CheckCircle size={18} /> Approve @ {selectedProgress}%
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${isFinalized ? "bg-transparent border-gray-600 text-gray-600 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white border-white/10"}`}
            >
              <XCircle size={18} /> Deny Submission
            </button>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <RejectModal
          reason={rejectReason}
          setReason={setRejectReason}
          onConfirm={handleReject}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      {previewFile && (
        <EvidencePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const LoadingState: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
    <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
    <p className="text-[#8c94a4] font-black uppercase tracking-[0.3em] text-[10px]">
      Verifying Registry...
    </p>
  </div>
);

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#c2a336] transition-colors">
      {icon} {label}
    </div>
    <div className="text-xs font-black text-[#1a3a32] truncate uppercase tracking-tight">
      {value}
    </div>
  </div>
);

const EmptyEvidence: React.FC = () => (
  <div className="p-12 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
    <AlertTriangle size={32} className="mx-auto text-amber-300 mb-4" />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      No exhibits discovered
    </p>
  </div>
);

const RejectModal: React.FC<{
  reason: string;
  setReason: (r: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ reason, setReason, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-[#1a3a32]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
      <div className="flex items-center gap-3 text-rose-600 mb-6">
        <AlertTriangle size={28} />
        <h2 className="text-2xl font-black uppercase tracking-tight italic">
          Revision Needed
        </h2>
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Provide instructions for the custodian..."
        className="w-full border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-8 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition-all min-h-[150px]"
      />
      <div className="flex gap-4">
        <button
          onClick={onClose}
          className="flex-1 py-4 font-black uppercase tracking-widest text-slate-400 text-[10px]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-200"
        >
          Confirm Rejection
        </button>
      </div>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "pending":
    case "upcoming":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default SubmittedIndicatorDetail;
