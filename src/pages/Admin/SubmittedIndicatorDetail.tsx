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
  ExternalLink,
  AlertTriangle,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

/* --- Updated Thunk --- */
export interface UpdateIndicatorStatusPayload {
  id: string;
  updates: {
    status?: IndicatorStatus;
    notes?: unknown[];
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

const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);

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

  const getUserName = (userId: string | null) => {
    if (!userId) return "-";
    const user = users.find((u) => u._id === userId);
    return user ? user.name : "Judicial Official";
  };

  const handleApprove = async () => {
    const res = await dispatch(
      updateIndicatorStatus({
        id: indicator!._id,
        updates: { status: "approved" },
      })
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Submission Verified & Approved");
      navigate("/admin/submitted");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("A justification is required for rejection.");
      return;
    }
    const res = await dispatch(
      updateIndicatorStatus({
        id: indicator!._id,
        updates: {
          status: "rejected",
          notes: [{ reason: rejectReason, date: new Date() }],
        },
      })
    );
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Submission Sent Back for Revision");
      setShowRejectModal(false);
      navigate("/admin/submitted");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-bold uppercase tracking-widest text-xs">
          Loading Submission Evidence...
        </p>
      </div>
    );

  if (!indicator)
    return (
      <div className="p-20 text-center font-bold text-[#1a3a32]">
        Record Not Found.
      </div>
    );

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#8c94a4] hover:text-[#1a3a32] font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={16} /> Back to Inbox
        </button>
        <div className="flex gap-3">
          <span
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(
              indicator.status
            )}`}
          >
            {indicator.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-[#1a3a32] tracking-tight leading-tight mb-2">
                {indicator.indicatorTitle}
              </h1>
              <p className="text-[#c2a336] font-bold text-xs uppercase tracking-widest">
                {indicator.category?.title} &rsaquo;{" "}
                {indicator.level2Category?.title ?? "Standard"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-gray-50">
              <Stat
                icon={<UserIcon size={14} />}
                label="Custodian"
                value={
                  indicator.assignedToType === "individual"
                    ? getUserName(indicator.assignedTo)
                    : "Group"
                }
              />
              <Stat
                icon={<Calendar size={14} />}
                label="Due Date"
                value={new Date(indicator.dueDate).toLocaleDateString()}
              />
              <Stat
                icon={<History size={14} />}
                label="Unit"
                value={indicator.unitOfMeasure}
              />
              <Stat
                icon={<FileText size={14} />}
                label="Progress"
                value={`${indicator.progress}%`}
              />
            </div>

            {/* Evidence Section */}
            <div className="mt-8">
              <h3 className="text-sm font-black text-[#1a3a32] uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="text-[#c2a336]" size={18} />
                Verification Evidence (Exhibits)
              </h3>
              {indicator.evidence?.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {indicator.evidence.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-2xl border border-gray-100 hover:border-[#c2a336] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText size={20} className="text-[#1a3a32]" />
                        </div>
                        <span className="text-sm font-bold text-[#1a3a32]">
                          {file.name || `Exhibit_${idx + 1}.pdf`}
                        </span>
                      </div>
                      <ExternalLink
                        size={16}
                        className="text-[#8c94a4] group-hover:text-[#c2a336]"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 text-amber-800">
                  <AlertTriangle size={20} />
                  <p className="text-sm font-medium">
                    No external evidence files were uploaded with this
                    submission.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Decision Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#1a3a32] rounded-3xl p-8 text-white shadow-xl shadow-[#1a3a32]/10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-60">
              Verdict Action
            </h3>
            <p className="text-sm leading-relaxed mb-8 opacity-90">
              Please verify that the provided progress and evidence align with
              institutional standards before approving.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleApprove}
                className="w-full flex items-center justify-center gap-2 bg-[#c2a336] hover:bg-[#d4b44a] text-[#1a3a32] py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                <CheckCircle size={18} /> Approve Submission
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20"
              >
                <XCircle size={18} /> Request Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100">
            <h3 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em] mb-4">
              Internal Log
            </h3>
            <div className="text-[11px] text-[#1a3a32] font-medium leading-relaxed italic">
              Submitted on{" "}
              {new Date(indicator.updatedAt || Date.now()).toLocaleString()} by{" "}
              {getUserName(indicator.assignedTo)}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-[#1a3a32]/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <XCircle size={24} />
              <h2 className="text-xl font-black uppercase tracking-tight">
                Rejection Justification
              </h2>
            </div>
            <p className="text-[#8c94a4] text-sm mb-4 font-medium italic">
              The custodian will be notified and asked to resubmit based on your
              comments below.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., Missing supporting documentation for indicator progress..."
              className="w-full border border-gray-100 bg-[#f8f9fa] rounded-2xl p-4 mb-6 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium transition-all"
              rows={5}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-[#8c94a4] hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-4 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Helpers --- */
const Stat = ({ icon, label, value }: any) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#8c94a4] uppercase tracking-wider">
      {icon} {label}
    </div>
    <div className="text-xs font-bold text-[#1a3a32] truncate">{value}</div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

export default SubmittedIndicatorDetail;
