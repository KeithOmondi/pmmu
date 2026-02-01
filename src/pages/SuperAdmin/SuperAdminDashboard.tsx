import React, { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import { fetchCategories } from "../../store/slices/categoriesSlice";
import { fetchUsers } from "../../store/slices/userSlice";
import { Loader2, ShieldCheck, Gavel, Clock, FileBarChart } from "lucide-react";

/* ============================================================
   STYLING & THEMES
============================================================ */
const STATUS_COLORS = {
  inProgress: "#1E3A2B",
  submitted: "#4B5563",
  approved: "#C69214",
  late: "#991B1B",
  completed: "#059669",
};

const BOX_THEMES = {
  inProgress: "bg-[#F0FDF4] border-[#1E3A2B] text-[#1E3A2B]",
  submitted: "bg-[#F9FAFB] border-[#4B5563] text-[#4B5563]",
  approved: "bg-[#FFFBEB] border-[#C69214] text-[#C69214]",
  late: "bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]",
  completed: "bg-[#ECFDF5] border-[#059669] text-[#059669]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Under Review",
  approved: "Awaiting Seal",
  completed: "Certified",
  rejected: "Returned",
};

/* ============================================================
   MAIN DASHBOARD COMPONENT
============================================================ */
const SuperAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);

  // AUTO-REFRESH LOGIC
  useEffect(() => {
    const refreshData = () => {
      dispatch(fetchAllIndicatorsForAdmin());
      dispatch(fetchCategories());
      dispatch(fetchUsers());
    };

    // Initial load
    refreshData();

    // Heartbeat every 15 seconds for background updates
    const heartbeat = setInterval(refreshData, 15000);

    // Cleanup on unmount to prevent memory leaks
    return () => clearInterval(heartbeat);
  }, [dispatch]);

  const metrics = useMemo(() => {
    const now = Date.now();
    return {
      inProgress: indicators.filter(
        (i) =>
          new Date(i.startDate).getTime() <= now &&
          !["completed", "approved", "rejected", "submitted"].includes(
            i.status,
          ),
      ).length,
      submitted: indicators.filter((i) => i.status === "submitted").length,
      readyForSeal: indicators.filter((i) => i.status === "approved").length,
      late: indicators.filter(
        (i) =>
          !["completed", "rejected"].includes(i.status) &&
          new Date(i.dueDate).getTime() < now,
      ).length,
      finalized: indicators.filter((i) => i.status === "completed").length,
    };
  }, [indicators]);

  // HARD LOADING: Only show on initial mount when no data exists
  if (indicatorsLoading && indicators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FDFDFD]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1E3A2B] mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C69214]">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-8 md:px-8 font-sans">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        {/* EXECUTIVE HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-[#C69214] pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[#1E3A2B] rounded-lg shadow-lg">
              <Gavel className="text-[#C69214]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1E3A2B] tracking-tight font-serif uppercase">
                High Court Registry
              </h1>
              <p className="text-[#C69214] font-bold text-[10px] tracking-[0.15em] uppercase">
                Super-Admin Oversight
              </p>
            </div>
          </div>

          {/* SYSTEM STATUS INDICATOR */}
          <div className="flex items-center gap-3 bg-[#1E3A2B] px-5 py-2.5 rounded-md shadow-lg border-l-4 border-[#C69214]">
            {indicatorsLoading ? (
              <Loader2 size={14} className="text-[#C69214] animate-spin" />
            ) : (
              <Clock size={14} className="text-[#C69214] animate-pulse" />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider text-white">
              {indicatorsLoading
                ? "Syncing Registry..."
                : `System Live: ${new Date().toLocaleTimeString()}`}
            </span>
          </div>
        </header>

        {/* STAT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatBox
            label="In Progress"
            value={metrics.inProgress}
            color={STATUS_COLORS.inProgress}
            theme={BOX_THEMES.inProgress}
          />
          <StatBox
            label="Under Review"
            value={metrics.submitted}
            color={STATUS_COLORS.submitted}
            theme={BOX_THEMES.submitted}
          />
          <StatBox
            label="Approved"
            value={metrics.readyForSeal}
            color={STATUS_COLORS.approved}
            theme={BOX_THEMES.approved}
          />
          <StatBox
            label="Late Submission"
            value={metrics.late}
            color={STATUS_COLORS.late}
            theme={BOX_THEMES.late}
          />
          <StatBox
            label="Completed"
            value={metrics.finalized}
            color={STATUS_COLORS.completed}
            theme={BOX_THEMES.completed}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ACTIVITY TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E5D5B0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F9F4E8] flex justify-between items-center bg-[#F9F4E8]/30">
              <div className="flex items-center gap-2">
                <FileBarChart size={18} className="text-[#1E3A2B]" />
                <h2 className="text-[11px] font-black text-[#1E3A2B] uppercase tracking-widest">
                  Recent Filings
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {indicators.slice(0, 6).map((i) => (
                    <tr
                      key={i._id}
                      className="hover:bg-[#F9F4E8]/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#1E3A2B] group-hover:text-[#C69214]">
                          {i.indicatorTitle}
                        </p>
                        <p className="text-[9px] uppercase font-bold text-gray-400">
                          {i.category?.title}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-[9px] font-black px-3 py-1.5 rounded-full border shadow-sm ${
                            i.status === "approved"
                              ? "bg-[#FFF9E6] text-[#C69214] border-[#C69214]"
                              : "bg-white text-gray-400 border-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[i.status] || i.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDEBAR ANALYTICS */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5D5B0] p-6">
              <h3 className="text-[10px] font-black text-[#C69214] uppercase tracking-[0.2em] mb-6 border-b border-[#F9F4E8] pb-3 text-center">
                Distribution
              </h3>
              <AdminStatusPieChart
                data={[
                  {
                    name: "Active",
                    value: metrics.inProgress,
                    color: STATUS_COLORS.inProgress,
                  },
                  {
                    name: "Review",
                    value: metrics.submitted,
                    color: STATUS_COLORS.submitted,
                  },
                  {
                    name: "Seal",
                    value: metrics.readyForSeal,
                    color: STATUS_COLORS.approved,
                  },
                  {
                    name: "Late",
                    value: metrics.late,
                    color: STATUS_COLORS.late,
                  },
                  {
                    name: "Done",
                    value: metrics.finalized,
                    color: STATUS_COLORS.completed,
                  },
                ]}
              />
            </div>

            {metrics.readyForSeal > 0 && (
              <div className="bg-[#1E3A2B] rounded-2xl p-6 text-white border-l-[8px] border-[#C69214] shadow-xl">
                <ShieldCheck
                  className="text-[#C69214] mb-2 opacity-90"
                  size={28}
                />
                <h4 className="text-xs font-black uppercase tracking-tight">
                  Judicial Seal Required
                </h4>
                <p className="text-[11px] text-gray-300 mt-2 leading-relaxed">
                  <span className="text-[#C69214] font-black">
                    {metrics.readyForSeal}
                  </span>{" "}
                  filings awaiting executive certification.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SUB-COMPONENTS
============================================================ */

const StatBox = ({ label, value, color, theme }: any) => (
  <div
    className={`p-5 rounded-xl border-l-[6px] transition-all shadow-sm flex flex-col justify-between group hover:shadow-md hover:-translate-y-0.5 ${theme}`}
  >
    <div className="flex justify-between items-start mb-4">
      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">
        {label}
      </p>
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
    <div className="flex items-baseline gap-2">
      <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
      <span className="text-[8px] font-bold uppercase opacity-40">Records</span>
    </div>
  </div>
);

const AdminStatusPieChart: React.FC<{
  data: { name: string; value: number; color: string }[];
}> = ({ data }) => {
  const total = data.reduce((s, i) => s + i.value, 0);
  if (!total)
    return (
      <div className="h-32 flex items-center justify-center text-[10px] italic text-gray-400 uppercase">
        Registry Empty
      </div>
    );

  return (
    <div className="relative h-40 flex justify-center items-center">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((e, i) => {
          let start = 0;
          for (let x = 0; x < i; x++) start += (data[x].value / total) * 360;
          const end = start + (e.value / total) * 360;
          const arc = end - start <= 180 ? 0 : 1;
          const sx = 50 + 40 * Math.cos((Math.PI * start) / 180);
          const sy = 50 + 40 * Math.sin((Math.PI * start) / 180);
          const ex = 50 + 40 * Math.cos((Math.PI * end) / 180);
          const ey = 50 + 40 * Math.sin((Math.PI * end) / 180);
          return (
            <path
              key={e.name}
              d={`M50,50 L${sx},${sy} A40,40 0 ${arc},1 ${ex},${ey} Z`}
              fill={e.color}
              className="transition-all duration-500 hover:opacity-70 cursor-pointer"
            />
          );
        })}
        <circle cx="50" cy="50" r="34" fill="white" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-[#1E3A2B]">{total}</span>
        <span className="text-[8px] uppercase font-bold tracking-widest text-[#C69214]">
          Items
        </span>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
