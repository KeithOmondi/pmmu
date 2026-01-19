// src/pages/Admin/SubmittedIndicatorDetail.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  downloadEvidence as downloadEvidenceThunk,
  selectAllIndicators,
  selectIndicatorsLoading,
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
  Download,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

/* =====================================
   COMPONENT
===================================== */
const AdminIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);
  const isLoading = useAppSelector(selectIndicatorsLoading);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  /* =====================================
      FETCH DATA
  ===================================== */
  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const indicator = useMemo(() => {
    return indicators.find((i) => i._id === id) || null;
  }, [id, indicators]);

  /* =====================================
      HELPERS & ACTIONS
  ===================================== */
  const getUserName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u._id === userId);
    return user?.name ?? "System Official";
  };

  const handleDownload = async (file: {
    publicId: string;
    fileName: string;
  }) => {
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
      toast.success("Download started successfully");
    } catch (err: any) {
      toast.error(err || "Secure download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  /* =====================================
      RENDER STATES
  ===================================== */
  if (isLoading && !indicator) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-black uppercase tracking-widest text-xs">
          Accessing Official Record...
        </p>
      </div>
    );
  }

  if (!indicator) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-gray-500 font-bold">Record not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#c2a336] underline font-bold"
        >
          Return to Registry
        </button>
      </div>
    );
  }

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
                Registry Review Mode
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
                {indicator.category?.title ?? "General Category"}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity size={16} className="text-[#c2a336]" />
                Metric: {indicator.unitOfMeasure}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Section 1: Context */}
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
              label="Last Activity"
              value={new Date(indicator.updatedAt).toLocaleDateString()}
            />
            <DetailItem
              icon={<Calendar size={18} />}
              label="Filing Deadline"
              value={new Date(indicator.dueDate).toLocaleDateString()}
            />
          </Section>

          {/* Section 2: Evidence & Progress */}
          <Section title="Verification Hub" className="bg-gray-50/30">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-[#1a3a32]">
                    Current Progress Score
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

              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-[#8c94a4] uppercase mb-4 tracking-wider">
                  Exhibits for Review
                </h4>

                {indicator.evidence.length > 0 ? (
                  <ul className="space-y-3">
                    {indicator.evidence.map((file) => (
                      <li
                        key={file.publicId}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileCheck
                            size={16}
                            className="text-[#c2a336] flex-shrink-0"
                          />
                          <span className="text-sm font-bold truncate text-[#1a3a32]">
                            {file.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.publicId}
                          className="p-2 hover:bg-[#f4f0e6] rounded-full text-[#c2a336] transition-colors disabled:opacity-50"
                        >
                          {downloadingId === file.publicId ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-bold text-gray-400 italic">
                    No files provided.
                  </p>
                )}

                {/* READ-ONLY STATUS NOTICE */}
                <div className="mt-8 p-4 bg-[#f4f0e6] rounded-xl border border-[#c2a336]/20 text-center">
                  <ShieldCheck
                    size={24}
                    className="mx-auto text-[#c2a336] mb-2"
                  />
                  <p className="text-[10px] font-black text-[#1a3a32] uppercase tracking-widest">
                    Read-Only Audit Mode
                  </p>
                  <p className="text-[10px] text-[#8c94a4] mt-1 font-medium italic">
                    Record status and progress are locked in this view.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 3: Notes */}
          <Section title="Internal Ledger">
            <div className="space-y-4">
              {indicator.notes.length > 0 ? (
                <div className="space-y-4">
                  {indicator.notes.map((note: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-xl border-l-4 border-[#c2a336] shadow-sm"
                    >
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{typeof note === "string" ? note : note.text}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Info size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs font-bold text-gray-400 italic">
                    Registry is clear of remarks.
                  </p>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

/* =====================================
   UI HELPERS (SUB-COMPONENTS)
===================================== */
const Section: React.FC<{
  title: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, children, className = "" }) => (
  <div className={`p-8 lg:p-10 space-y-6 ${className}`}>
    <h3 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-widest border-b border-gray-100 pb-2">
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
  <div className="flex items-start gap-4">
    <div className="p-3 bg-[#f4f0e6] text-[#c2a336] rounded-xl">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-tight">
        {label}
      </p>
      <p className="text-sm font-black text-[#1a3a32]">{value}</p>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-100";
    case "submitted":
      return "bg-blue-500/20 border-blue-500/50 text-blue-100";
    case "pending":
      return "bg-amber-500/20 border-amber-500/50 text-amber-100";
    case "rejected":
      return "bg-rose-500/20 border-rose-500/50 text-rose-100";
    default:
      return "bg-gray-500/20 border-gray-500/50 text-gray-100";
  }
};

export default AdminIndicatorDetail;
