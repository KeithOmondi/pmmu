// src/pages/Admin/AdminIndicatorDetail.tsx
import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import {
  fetchUsers,
  selectAllUsers,
  type IUser,
} from "../../store/slices/userSlice";
import {
  Loader2,
  ChevronLeft,
  User as UserIcon,
  Users as GroupIcon,
  FileText,
  Activity,
  Info,
  Clock,
  Calendar,
  FileCheck,
  ShieldCheck,
} from "lucide-react";

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
      HELPERS
  ===================================== */
  /**
   * FIX: Updated to handle both string IDs and populated objects
   * per the TS2345 error.
   */
  const getUserName = (
    userParam: string | { _id: string; name: string } | null,
  ): string => {
    if (!userParam) return "System Official";

    // If it's a populated object, return the name property directly
    if (typeof userParam === "object" && "name" in userParam) {
      return userParam.name;
    }

    // If it's a string ID, look it up in the users store
    const user = users.find((u: IUser) => u._id === userParam);
    return user?.name ?? "Unknown Official";
  };

  const renderCustodians = (): string => {
    if (!indicator) return "-";

    if (indicator.assignedToType === "individual") {
      return getUserName(indicator.assignedTo);
    }

    if (indicator.assignedToType === "group") {
      const groupNames = (indicator.assignedGroup || [])
        .map((id: string) => users.find((u: IUser) => u._id === id)?.name)
        .filter(Boolean);

      return groupNames.length > 0 ? groupNames.join(", ") : "Assigned Group";
    }

    return "Unassigned";
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
                  indicator.status,
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
                <span className="p-1 bg-[#c2a336]/20 rounded text-[#c2a336]">
                  <Info size={14} />
                </span>
                {indicator.category?.title ?? "General Category"}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="p-1 bg-[#c2a336]/20 rounded text-[#c2a336]">
                  <Activity size={14} />
                </span>
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
              icon={
                indicator.assignedToType === "group" ? (
                  <GroupIcon size={18} />
                ) : (
                  <UserIcon size={18} />
                )
              }
              label={
                indicator.assignedToType === "group"
                  ? "Group Custodians"
                  : "Primary Custodian"
              }
              value={renderCustodians()}
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
                    className="bg-[#1a3a32] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${indicator.progress}%` }}
                  />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-[#8c94a4] uppercase mb-4 tracking-wider">
                  Submitted Exhibits
                </h4>

                {indicator.evidence.length > 0 ? (
                  <ul className="space-y-3">
                    {indicator.evidence.map((file) => (
                      <li
                        key={file.publicId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                      >
                        <FileCheck
                          size={16}
                          className="text-[#c2a336] flex-shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate text-[#1a3a32]">
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase">
                            {file.mimeType} •{" "}
                            {(file.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
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
                    Registry records are locked in this view.
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
                  {indicator.notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-xl border-l-4 border-[#c2a336] shadow-sm space-y-2"
                    >
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{note.text}"
                      </p>
                      <div className="flex justify-between items-center text-[9px] font-black text-[#8c94a4] uppercase tracking-tighter">
                        <span>{getUserName(note.createdBy)}</span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
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
      <p className="text-sm font-black text-[#1a3a32] whitespace-pre-wrap">
        {value}
      </p>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
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
