import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
} from "../../store/slices/indicatorsSlice";
import { fetchUsers, selectAllUsers } from "../../store/slices/userSlice";
import {
  Loader2,
  ChevronLeft,
  Calendar,
  User as UserIcon,
  FileText,
  Activity,
  Info,
  Clock,
  FileCheck,
} from "lucide-react";

const AdminIndicatorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const indicators = useAppSelector(selectAllIndicators);
  const users = useAppSelector(selectAllUsers);

  const [indicator, setIndicator] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Keep indicator updated, especially after user submissions
  useEffect(() => {
    if (id && indicators.length) {
      const found = indicators.find((i) => i._id === id);
      setIndicator(found || null);
    }
  }, [id, indicators]);

  const getUserName = (userId: string | null) => {
    if (!userId) return "-";
    const user = users.find((u) => u._id === userId);
    return user ? user.name : "System Official";
  };

  if (!indicator) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-bold uppercase tracking-widest text-xs">
          Retrieving Dossier...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 bg-[#f8f9fa] space-y-6">
      {/* Top Navigation */}
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

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#1a3a32] p-8 md:p-12 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText size={120} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#c2a336] text-[#1a3a32] rounded-full text-[10px] font-black uppercase tracking-tighter">
                Official Record
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyles(
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

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Section 1: Assignment Details */}
          <div className="p-8 space-y-6">
            <h3 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em]">
              Assignment Context
            </h3>
            <div className="space-y-4">
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
            </div>
          </div>

          {/* Section 2: Progress & Evidence */}
          <div className="p-8 space-y-6 bg-gray-50/30">
            <h3 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em]">
              Current Performance
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
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
                    className="bg-[#1a3a32] h-3 rounded-full transition-all duration-1000 shadow-inner"
                    style={{ width: `${indicator.progress}%` }}
                  />
                </div>
              </div>

              {/* Evidence Archive */}
              <div className="p-4 bg-white rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em] mb-2">
                  Submitted Evidence
                </h4>
                {indicator.evidence?.length > 0 ? (
                  <ul className="space-y-2">
                    {indicator.evidence.map((file: any, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700 font-bold"
                      >
                        <FileCheck size={16} className="text-[#c2a336]" />
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline truncate"
                        >
                          {file.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-bold text-gray-400 italic">
                    No evidence submitted yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Official Notes */}
          <div className="p-8 space-y-6">
            <h3 className="text-[10px] font-black text-[#8c94a4] uppercase tracking-[0.2em]">
              Internal Memoranda
            </h3>
            {indicator.notes?.length > 0 ? (
              <ul className="space-y-4">
                {indicator.notes.map((note: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm text-gray-600 leading-relaxed italic"
                  >
                    <div className="min-w-[4px] h-4 bg-[#c2a336]/30 rounded-full mt-1" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs font-bold text-gray-400 uppercase italic">
                  No additional notes provided.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Helpers --- */
const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-[#f4f0e6] text-[#c2a336] rounded-lg">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-bold text-[#1a3a32]">{value}</p>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status) {
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
