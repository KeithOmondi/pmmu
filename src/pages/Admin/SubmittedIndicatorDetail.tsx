// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const SubmittedIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Selectors
  const indicators = useAppSelector((state) => state.indicators.allIndicators);
  const users = useAppSelector(selectAllUsers);
  const { user: currentUser } = useAppSelector((state) => state.auth); // Assuming auth slice stores user info

  const [loading, setLoading] = useState<boolean>(true);
  const [previewFile, setPreviewFile] = useState<IEvidence | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [selectedProgress, setSelectedProgress] = useState<number>(0);

  const isSuperAdmin = currentUser?.role?.toLowerCase() === "superadmin";

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

  const renderCustodians = (): string => {
    if (!indicator) return "-";
    if (indicator.assignedToType === "individual") {
      return (
        users.find((u: IUser) => u._id === indicator.assignedTo)?.name ||
        "Individual Custodian"
      );
    }
    if (indicator.assignedToType === "group") {
      const groupNames = indicator.assignedGroup
        .map((userId) => users.find((u: IUser) => u._id === userId)?.name)
        .filter(Boolean);
      return groupNames.length > 0 ? groupNames.join(", ") : "Assigned Group";
    }
    return "Official";
  };

  /**
   * UPDATED FINALIZATION LOGIC:
   * If user is Superadmin, it's only finalized if status is 'completed'.
   * If user is Admin, it's finalized if it's already 'approved' or 'completed'.
   */
  const isFinalized: boolean = isSuperAdmin
    ? indicator?.status === "completed"
    : indicator?.status === "approved" || indicator?.status === "completed";

 const handleApprove = async () => {
  if (!indicator || isFinalized) return;

  // Change: Wrap the ID in an object to match the new Thunk signature
  // You can also pass a note here if you want it recorded in the audit trail
  const res = await dispatch(
    approveIndicator({ 
      id: indicator._id, 
      notes: `Approved by ${currentUser?.role || "Admin"}` 
    })
  );

  if (res.meta.requestStatus === "fulfilled") {
    // Notifications and state updates are handled in the slice/backend
    toast.success(isSuperAdmin ? "Indicator Finalized" : "Indicator Approved");
    navigate("/admin/dashboard");
  } else {
    toast.error("Approval failed. Please check the logs.");
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
      toast.success("Indicator returned for revision.");
      setShowRejectModal(false);
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast.error(err || "Failed to reject indicator.");
    }
  };

  if (loading) return <LoadingState />;
  if (!indicator)
    return (
      <div className="p-20 text-center font-bold text-[#1a3a32]">
        Record Not Found.
      </div>
    );

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-8 max-w-7xl mx-auto select-none font-sans">
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
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${getStatusStyles(indicator.status)}`}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
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
                icon={
                  indicator.assignedToType === "group" ? (
                    <GroupIcon size={14} />
                  ) : (
                    <UserIcon size={14} />
                  )
                }
                label={
                  indicator.assignedToType === "group"
                    ? "Group Custodians"
                    : "Custodian"
                }
                value={renderCustodians()}
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

          {/* Evidence Section */}
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
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="bg-[#1a3a32] rounded-[3rem] p-8 text-white shadow-2xl space-y-8 sticky top-10 border border-white/5">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-[#c2a336]">
              {isSuperAdmin ? "Final Certification" : "Registry Approval"}
            </h3>
            <p className="text-xs leading-relaxed text-slate-300 font-medium">
              {isSuperAdmin
                ? "As a Superadmin, your approval will mark this record as COMPLETED and finalize the audit."
                : "Upon your approval, this record moves to the APPROVED state for final Superadmin review."}
            </p>
          </div>

          <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#c2a336] block">
              Audit Metric Value
            </label>
            <div className="relative">
              <select
                disabled={isFinalized}
                value={selectedProgress}
                onChange={(e) => setSelectedProgress(Number(e.target.value))}
                className="w-full bg-[#1a3a32] border-2 border-white/10 rounded-2xl p-4 text-sm font-black appearance-none focus:border-[#c2a336] outline-none transition-all cursor-pointer disabled:opacity-50"
              >
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                  (val: number) => (
                    <option
                      key={val}
                      value={val}
                      className="bg-[#1a3a32] text-white"
                    >
                      {val}% Progress
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
              <Gavel size={18} />{" "}
              {isSuperAdmin ? "Finalize & Complete" : "Approve Record"}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isFinalized}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${isFinalized ? "bg-transparent border-gray-600 text-gray-600 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white border-white/10"}`}
            >
              <XCircle size={18} /> Return for Revision
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

/* --- SUB-COMPONENTS & STYLES --- */

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
    <div className="text-xs font-black text-[#1a3a32] uppercase tracking-tight line-clamp-2">
      {value}
    </div>
  </div>
);

const EmptyEvidence: React.FC = () => (
  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
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
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default SubmittedIndicatorDetail;
