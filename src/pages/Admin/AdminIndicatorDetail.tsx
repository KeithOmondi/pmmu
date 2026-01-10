// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  downloadEvidence as downloadEvidenceThunk,
  selectAllIndicators,
} from "../../store/slices/indicatorsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
import {
  Loader2,
  ChevronLeft,
  User as UserIcon,
  FileText,
  Activity,
  Info,
  Clock,
  Calendar,
  FileCheck,
} from "lucide-react";

/* =====================================
   TYPES
===================================== */
interface IEvidenceFile {
  fileUrl: string;
  fileName: string;
  publicId: string;
  fileSize?: number;
  fileType?: string;
}

interface IIndicator {
  _id: string;
  indicatorTitle: string;
  category: { _id: string; title: string } | null;
  unitOfMeasure: string;
  assignedToType: "individual" | "group";
  assignedTo: string | null;
  startDate: string;
  dueDate: string;
  progress: number;
  notes: string[];
  evidence: IEvidenceFile[];
  status: string;
}

/* =====================================
   COMPONENT
===================================== */
const AdminIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);

  const [indicator, setIndicator] = useState<IIndicator | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* =====================================
     FETCH DATA
  ===================================== */
  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!id || !indicators.length) return;

    const found = indicators.find((i) => i._id === id);
    if (!found) {
      setIndicator(null);
      return;
    }

    setIndicator({
      ...found,
      notes: Array.isArray(found.notes)
        ? found.notes.filter((n): n is string => typeof n === "string")
        : [],
    });
  }, [id, indicators]);

  /* =====================================
     HELPERS
  ===================================== */
  const getUserName = (userId: string | null) => {
    if (!userId) return "-";
    const user = users.find((u) => u._id === userId);
    return user?.name ?? "System Official";
  };

  const downloadEvidence = async (file: IEvidenceFile) => {
    if (!indicator || indicator.status === "approved") return; // disable downloads if approved
    try {
      setError(null);
      setDownloadingId(file.publicId);

      await dispatch(
        downloadEvidenceThunk({
          publicId: file.publicId,
          fileName: file.fileName,
        })
      ).unwrap();
    } catch (err: any) {
      console.error(err);
      setError(err ?? "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApprove = () => {
    // Approval logic should be integrated with a thunk if needed
    // For now, disabled button if already approved
    console.log("Approve clicked");
  };

  const handleReject = () => {
    console.log("Reject clicked");
  };

  /* =====================================
     LOADING STATE
  ===================================== */
  if (!indicator) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-black uppercase tracking-widest text-xs">
          Loading Indicator Details...
        </p>
      </div>
    );
  }

  /* =====================================
     RENDER
  ===================================== */
  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#8c94a4] hover:text-[#1a3a32] font-bold text-xs uppercase tracking-widest transition-colors group"
      >
        <ChevronLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Registry
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="bg-[#1a3a32] p-8 md:p-12 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText size={120} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#c2a336] text-[#1a3a32] rounded-full text-[10px] font-black uppercase">
                Official Record
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyles(
                  indicator.status
                )}`}
              >
                {indicator.status}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight max-w-3xl">
              {indicator.indicatorTitle}
            </h1>

            <div className="flex flex-wrap gap-6 pt-4 text-white/70">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info size={16} className="text-[#c2a336]" />
                {indicator.category?.title ?? "General"}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity size={16} className="text-[#c2a336]" />
                {indicator.unitOfMeasure}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Assignment Context */}
          <Section title="Assignment Context">
            <DetailItem
              icon={<UserIcon size={18} />}
              label="Primary Custodian"
              value={
                indicator.assignedToType === "individual"
                  ? getUserName(indicator.assignedTo)
                  : "Group Assignment"
              }
            />
            <DetailItem
              icon={<Clock size={18} />}
              label="Effective Since"
              value={new Date(indicator.startDate).toLocaleDateString()}
            />
            <DetailItem
              icon={<Calendar size={18} />}
              label="Reporting Deadline"
              value={new Date(indicator.dueDate).toLocaleDateString()}
            />
          </Section>

          {/* Current Performance */}
          <Section title="Current Performance" className="bg-gray-50/30">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-[#1a3a32]">
                    Completion Progress
                  </span>
                  <span className="text-2xl font-black text-[#c2a336]">
                    {indicator.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#1a3a32] h-3 rounded-full"
                    style={{ width: `${indicator.progress}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-[#8c94a4] uppercase mb-2">
                  Submitted Evidence
                </h4>

                {indicator.evidence.length ? (
                  <ul className="space-y-2">
                    {indicator.evidence.map((file) => (
                      <li
                        key={file.publicId}
                        className="flex items-center gap-2 text-sm font-bold"
                      >
                        <FileCheck size={16} className="text-[#c2a336]" />
                        <button
                          onClick={() => downloadEvidence(file)}
                          disabled={
                            downloadingId === file.publicId ||
                            indicator.status === "approved"
                          }
                          className={`underline truncate ${
                            indicator.status === "approved"
                              ? "text-gray-400 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {downloadingId === file.publicId
                            ? "Downloading..."
                            : file.fileName}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-bold text-gray-400 italic">
                    No evidence submitted yet.
                  </p>
                )}

                {error && (
                  <p className="text-xs text-red-500 mt-2 italic">{error}</p>
                )}

                {/* Approve / Reject Buttons */}
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={indicator.status === "approved"}
                    className={`flex-1 py-3 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest transition-all ${
                      indicator.status === "approved"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#c2a336] hover:bg-[#d4b44a]"
                    }`}
                  >
                    Confirm Approval
                  </button>

                  {indicator.status !== "approved" && (
                    <button
                      onClick={handleReject}
                      className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                    >
                      Return for Revision
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Internal Notes */}
          <Section title="Internal Memoranda">
            {indicator.notes.length ? (
              <ul className="space-y-4">
                {indicator.notes.map((note, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm text-gray-600 italic"
                  >
                    <div className="min-w-[4px] h-4 bg-[#c2a336]/30 rounded-full mt-1" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-bold text-gray-400 italic text-center">
                No additional notes provided.
              </p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

/* =====================================
   UI HELPERS
===================================== */
const Section: React.FC<{
  title: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, children, className = "" }) => (
  <div className={`p-8 space-y-6 ${className}`}>
    <h3 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-widest">
      {title}
    </h3>
    {children}
  </div>
);

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-[#f4f0e6] text-[#c2a336] rounded-lg">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-[#8c94a4] uppercase">{label}</p>
      <p className="text-sm font-bold text-[#1a3a32]">{value}</p>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-100";
    case "pending":
      return "bg-amber-500/20 border-amber-500/50 text-amber-100";
    case "rejected":
      return "bg-rose-500/20 border-rose-500/50 text-rose-100";
    case "overdue":
      return "bg-rose-500/30 border-rose-500/70 text-rose-50";
    default:
      return "bg-gray-500/20 border-gray-500/50 text-gray-100";
  }
};

export default AdminIndicatorDetail;
