// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  type IIndicator,
  type IndicatorStatus,
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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

/* --- Redux Thunk: Update Indicator Status --- */
export interface UpdateIndicatorStatusPayload {
  id: string;
  updates: {
    status?: IndicatorStatus;
    notes?: { text: string; createdBy: string; createdAt: Date }[];
  };
}

export const updateIndicatorStatus = createAsyncThunk<
  IIndicator,
  UpdateIndicatorStatusPayload,
  { rejectValue: string }
>("indicators/updateStatus", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/indicators/update/${id}`, updates);
    return data.indicator;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Update failed");
  }
});

/* --- Main Component --- */
const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);
  const currentUserId = "YOUR_LOGGED_IN_USER_ID"; // replace with actual

  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchAllIndicatorsForAdmin());
      await dispatch(fetchUsers());
      setLoading(false);
    };
    fetchData();
  }, [dispatch]);

  const indicator = indicators.find((i) => i._id === id);
  const getUserName = (userId: string | null) =>
    userId
      ? users.find((u) => u._id === userId)?.name || "Judicial Official"
      : "-";

  // Check if indicator is finalized (approved or completed)
  const isFinalized =
    indicator?.status === "approved" || indicator?.status === "completed";

  /* --- Handlers --- */
  const handleApprove = async () => {
    if (!indicator || isFinalized) return;

    const res = await dispatch(
      updateIndicatorStatus({
        id: indicator._id,
        updates: { status: "approved" },
      })
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Submission Verified & Approved");
      navigate("/admin/submitted");
    }
  };

  const handleReject = async () => {
    if (!indicator || isFinalized) return;
    if (!rejectReason.trim())
      return toast.error("A justification is required.");

    const note = {
      text: rejectReason.trim(),
      createdBy: currentUserId,
      createdAt: new Date(),
    };

    const res = await dispatch(
      updateIndicatorStatus({
        id: indicator._id,
        updates: { status: "rejected", notes: [note] },
      })
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Sent Back for Revision");
      setShowRejectModal(false);
      navigate("/admin/submitted");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-black uppercase tracking-[0.3em] text-[10px]">
          Verifying Registry Record...
        </p>
      </div>
    );

  if (!indicator)
    return <div className="p-20 text-center font-bold">Record Not Found.</div>;

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT */}
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
              <Stat
                icon={<FileText size={14} />}
                label="Target Unit"
                value={indicator.unitOfMeasure}
              />
              <Stat
                icon={<FileText size={14} />}
                label="Progress"
                value={`${indicator.progress}%`}
              />
            </div>
          </div>
          <EvidencePreview indicator={indicator} isFinalized={isFinalized} />
        </div>

        {/* RIGHT */}
        <DecisionSidebar
          indicator={indicator}
          handleApprove={handleApprove}
          setShowRejectModal={setShowRejectModal}
          isFinalized={isFinalized}
        />
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          handleReject={handleReject}
          closeModal={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
};

/* --- Helpers --- */
const Stat = ({ icon, label, value }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#c2a336] transition-colors">
      {icon} {label}
    </div>
    <div className="text-xs font-black text-[#1a3a32] truncate uppercase tracking-tight">
      {value}
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100/50";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100/50";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

/* --- Evidence Preview --- */
const EvidencePreview: React.FC<{
  indicator: IIndicator;
  isFinalized: boolean;
}> = ({ indicator, isFinalized }) => (
  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
    <div className="flex justify-between items-center mb-8">
      <h3 className="text-[10px] font-black text-[#1a3a32] uppercase tracking-[0.2em] flex items-center gap-2">
        <FileText className="text-[#c2a336]" size={18} /> Filed Exhibits
      </h3>
      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">
        Total Exhibits: {indicator.evidence?.length || 0}
      </span>
    </div>

    {!indicator.evidence?.length ? (
      <div className="p-12 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
        <AlertTriangle size={32} className="mx-auto text-amber-300 mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          No evidence files discovered in registry
        </p>
      </div>
    ) : (
      <ul className="space-y-3">
        {indicator.evidence.map((file) => (
          <li key={file.publicId} className="flex items-center justify-between">
            <span className="truncate">{file.fileName}</span>
            <button
              disabled={isFinalized}
              className={`text-[10px] font-black uppercase tracking-widest ${
                isFinalized
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#c2a336] underline hover:text-[#d4b44a]"
              }`}
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* --- Decision Sidebar --- */
const DecisionSidebar: React.FC<{
  indicator: IIndicator;
  handleApprove: () => void;
  setShowRejectModal: React.Dispatch<React.SetStateAction<boolean>>;
  isFinalized: boolean;
}> = ({ indicator, handleApprove, setShowRejectModal, isFinalized }) => (
  <div className="bg-[#1a3a32] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#1a3a32]/20 space-y-6">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-[#c2a336]">
      Judicial Verdict
    </h3>
    <p className="text-xs leading-relaxed mb-6 text-slate-300 font-medium">
      Reviewing: {indicator.indicatorTitle} ({indicator.progress}% complete).
      Approving will finalize this data.
    </p>
    <div className="space-y-3">
      {/* Approve */}
      <button
        onClick={handleApprove}
        disabled={isFinalized}
        className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
          isFinalized
            ? "bg-gray-400 cursor-not-allowed text-slate-200"
            : "bg-[#c2a336] hover:bg-[#d4b44a] text-[#1a3a32]"
        }`}
      >
        <CheckCircle size={18} /> Confirm Approval
      </button>

      {/* Reject */}
      <button
        onClick={() => setShowRejectModal(true)}
        disabled={isFinalized}
        className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${
          isFinalized
            ? "bg-gray-300 cursor-not-allowed text-gray-500 border-gray-300"
            : "bg-white/10 hover:bg-white/20 text-white border-white/10"
        }`}
      >
        <XCircle size={18} /> Return to Officer
      </button>
    </div>
  </div>
);

/* --- Reject Modal --- */
const RejectModal: React.FC<{
  rejectReason: string;
  setRejectReason: React.Dispatch<React.SetStateAction<string>>;
  handleReject: () => void;
  closeModal: () => void;
}> = ({ rejectReason, setRejectReason, handleReject, closeModal }) => (
  <div className="fixed inset-0 bg-[#1a3a32]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 text-rose-600 mb-6">
        <AlertTriangle size={28} />
        <h2 className="text-2xl font-black uppercase tracking-tight italic">
          Revision Needed
        </h2>
      </div>
      <p className="text-slate-400 text-sm mb-6 font-bold uppercase tracking-widest text-[10px]">
        Provide a clear reason for the custodian to address:
      </p>
      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        placeholder="e.g. Please provide a clear scanned copy of Annex A..."
        className="w-full border border-slate-100 bg-slate-50 rounded-2xl p-6 mb-8 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition-all min-h-[150px]"
      />
      <div className="flex gap-4">
        <button
          onClick={closeModal}
          className="flex-1 py-4 font-black uppercase tracking-widest text-slate-400 text-[10px]"
        >
          Cancel
        </button>
        <button
          onClick={handleReject}
          className="flex-[2] py-4 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
        >
          Confirm Rejection
        </button>
      </div>
    </div>
  </div>
);

export default SubmittedIndicatorDetail;
