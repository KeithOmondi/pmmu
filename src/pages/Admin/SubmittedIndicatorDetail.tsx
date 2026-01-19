// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  downloadEvidence as downloadEvidenceThunk,
  updateIndicator,
  rejectIndicator,
} from "../../store/slices/indicatorsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
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
  Download,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);

  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Manual progress tracking
  const [selectedProgress, setSelectedProgress] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([dispatch(fetchAllIndicatorsForAdmin()), dispatch(fetchUsers())]);
      setLoading(false);
    };
    fetchData();
  }, [dispatch]);

  const indicator = indicators.find((i) => i._id === id);

  // Sync progress
  useEffect(() => {
    if (indicator) setSelectedProgress(indicator.progress);
  }, [indicator]);

  const getUserName = (userId: string | null) =>
    userId ? users.find((u) => u._id === userId)?.name || "Official" : "-";

  const isFinalized = indicator?.status === "approved" || indicator?.status === "completed";

  /* --- HANDLERS --- */
  const handleDownload = async (file: any) => {
    if (!id) return;
    try {
      setDownloadingId(file.publicId);
      await dispatch(
        downloadEvidenceThunk({
          indicatorId: id,
          publicId: file.publicId,
          fileName: file.fileName,
        })
      ).unwrap();
    } catch (err) {
      toast.error("Secure download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApprove = async () => {
    if (!indicator || isFinalized) return;

    const res = await dispatch(
      updateIndicator({
        id: indicator._id,
        updates: {
          status: selectedProgress === 100 ? "completed" : "approved",
          progress: selectedProgress,
        },
      })
    );

    if (res.meta.requestStatus === "fulfilled") {
      toast.success(`Verified: Metric set to ${selectedProgress}%`);
      navigate("/admin/submitted");
    }
  };

  const handleReject = async () => {
    if (!indicator || isFinalized) return;

    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) return toast.error("A justification is required.");

    try {
      await dispatch(rejectIndicator({ id: indicator._id, notes: trimmedReason })).unwrap();
      toast.success("Indicator rejected successfully.");
      setShowRejectModal(false);
      navigate("/admin/submitted");
    } catch (err: any) {
      toast.error(err || "Failed to reject indicator.");
    }
  };

  if (loading) return <LoadingState />;
  if (!indicator) return <div className="p-20 text-center font-bold">Record Not Found.</div>;

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8 max-w-7xl mx-auto">
      {/* Header */}
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
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(
            indicator.status
          )}`}
        >
          Status: {indicator.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#c2a336] mb-4 font-black uppercase tracking-[0.2em] text-[10px]">
              <ShieldCheck size={14} /> Submission Audit #ID-
              {indicator._id.slice(-6).toUpperCase()}
            </div>
            <h1 className="text-3xl font-black text-[#1a3a32] tracking-tighter leading-[1.1] mb-6">
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
              <Stat icon={<FileText size={14} />} label="Target Unit" value={indicator.unitOfMeasure} />
              <Stat icon={<TrendingUp size={14} />} label="Current Audit" value={`${indicator.progress}%`} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <FileText className="text-[#c2a336]" size={18} /> Filed Exhibits
            </h3>
            {!indicator.evidence?.length ? (
              <EmptyEvidence />
            ) : (
              <ul className="divide-y divide-slate-50">
                {indicator.evidence.map((file) => (
                  <li
                    key={file.publicId}
                    className="py-4 flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1a3a32]">{file.fileName}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-black">{file.mimeType}</span>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.publicId}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-[#f4f0e6] text-[#c2a336] rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                      {downloadingId === file.publicId ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {downloadingId === file.publicId ? "..." : "Download"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DECISION SIDEBAR */}
        <div className="bg-[#1a3a32] rounded-[3rem] p-8 text-white shadow-2xl shadow-[#1a3a32]/20 space-y-8 sticky top-10">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-[#c2a336]">Audit Judgment</h3>
            <p className="text-xs leading-relaxed text-slate-300 font-medium">
              Assess the evidence provided and determine the manual progress percentage for this metric.
            </p>
          </div>

          {/* PROGRESS DROPDOWN */}
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
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                  <option key={val} value={val}>{val}% Completed</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <TrendingUp size={16} className="text-[#c2a336]" />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic">
              * Choosing 100% will automatically flag this as "Completed".
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                isFinalized ? "bg-gray-600 text-slate-400 cursor-not-allowed" : "bg-[#c2a336] hover:bg-[#d4b44a] text-[#1a3a32]"
              }`}
            >
              <CheckCircle size={18} /> Approve @ {selectedProgress}%
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${
                isFinalized ? "bg-transparent border-gray-600 text-gray-600 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white border-white/10"
              }`}
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
    </div>
  );
};

/* --- SUB-COMPONENTS --- */
const LoadingState = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
    <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
    <p className="text-[#8c94a4] font-black uppercase tracking-[0.3em] text-[10px]">
      Verifying Registry...
    </p>
  </div>
);

const Stat = ({ icon, label, value }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#c2a336] transition-colors">
      {icon} {label}
    </div>
    <div className="text-xs font-black text-[#1a3a32] truncate uppercase tracking-tight">{value}</div>
  </div>
);

const EmptyEvidence = () => (
  <div className="p-12 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
    <AlertTriangle size={32} className="mx-auto text-amber-300 mb-4" />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No exhibits discovered</p>
  </div>
);

const RejectModal = ({ reason, setReason, onConfirm, onClose }: any) => (
  <div className="fixed inset-0 bg-[#1a3a32]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 text-rose-600 mb-6">
        <AlertTriangle size={28} />
        <h2 className="text-2xl font-black uppercase tracking-tight italic">Revision Needed</h2>
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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default SubmittedIndicatorDetail;
